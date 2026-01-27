import { IPermissionStrategy, Permission, PermissionContext, PermissionResult } from './IPermissionStrategy';
import { IPersonRepository } from '@/repositories/interfaces/IPersonRepository';
import { IRelationshipRepository } from '@/repositories/interfaces/IRelationshipRepository';
import { ITreeRepository } from '@/repositories/interfaces/ITreeRepository';

interface AttributeRule {
  permission: Permission;
  condition: (context: PermissionContext, attributes: Record<string, unknown>) => boolean;
  description: string;
}

export class AttributeBasedPermissionStrategy implements IPermissionStrategy {
  name = 'abac';
  priority = 20; // Higher than RBAC

  private rules: AttributeRule[] = [];

  constructor(
    private readonly personRepository: IPersonRepository,
    private readonly relationshipRepository: IRelationshipRepository,
    private readonly treeRepository: ITreeRepository
  ) {
    this.initializeRules();
  }

  private initializeRules(): void {
    // Rule: Cannot edit deceased persons unless admin
    this.rules.push({
      permission: Permission.EDIT_PERSON,
      condition: (context, attrs) => {
        const person = attrs.person as { isLiving: boolean } | undefined;
        const userRole = attrs.userRole as string | undefined;

        if (person && !person.isLiving && userRole !== 'owner' && userRole !== 'admin') {
          return false;
        }
        return true;
      },
      description: 'Cannot edit deceased persons unless owner/admin',
    });

    // Rule: Cannot delete persons with relationships
    this.rules.push({
      permission: Permission.DELETE_PERSON,
      condition: (context, attrs) => {
        const relationshipCount = attrs.relationshipCount as number | undefined;
        return !relationshipCount || relationshipCount === 0;
      },
      description: 'Cannot delete persons with existing relationships',
    });

    // Rule: Cannot view living persons' details in public trees if privacy restricted
    this.rules.push({
      permission: Permission.VIEW_PERSON,
      condition: (context, attrs) => {
        const person = attrs.person as { isLiving: boolean } | undefined;
        const isCollaborator = attrs.isCollaborator as boolean | undefined;

        if (person?.isLiving && !isCollaborator) {
          // For public trees, restrict viewing living persons' details
          const treeIsPublic = attrs.treeIsPublic as boolean | undefined;
          if (treeIsPublic) {
            return false;
          }
        }
        return true;
      },
      description: 'Cannot view living person details in public trees',
    });
  }

  async canAccess(permission: Permission, context: PermissionContext): Promise<PermissionResult> {
    // Get attributes for the context
    const attributes = await this.getAttributes(context);

    // Check all rules for this permission
    const applicableRules = this.rules.filter(r => r.permission === permission);

    for (const rule of applicableRules) {
      if (!rule.condition(context, attributes)) {
        return {
          allowed: false,
          denied: true, // Explicit denial
          reason: rule.description,
        };
      }
    }

    // ABAC doesn't grant permissions, only restricts
    // Return "allowed" with no grantedBy to indicate neutral
    return {
      allowed: true,
      reason: 'No attribute-based restrictions apply',
    };
  }

  async getPermissions(context: PermissionContext): Promise<Permission[]> {
    // ABAC doesn't enumerate permissions, it only filters
    return [];
  }

  private async getAttributes(context: PermissionContext): Promise<Record<string, unknown>> {
    const attributes: Record<string, unknown> = {
      userId: context.userId,
      treeId: context.treeId,
      resourceType: context.resourceType,
      timestamp: new Date(),
    };

    // Load tree attributes
    const tree = await this.treeRepository.findById(context.treeId);
    if (tree) {
      attributes.treeIsPublic = tree.settings?.isPublic ?? false;
      // Check if user is a collaborator
      attributes.isCollaborator = tree.collaborators?.some(c => c.userId === context.userId) ?? false;
    }

    // Load person attributes if applicable
    if (context.resourceType === 'person' && context.resourceId) {
      const person = await this.personRepository.findById(context.resourceId);
      if (person) {
        // Derive isLiving from dateOfDeath
        attributes.person = {
          isLiving: !person.dateOfDeath,
        };
        // Get relationship count
        const relationships = await this.relationshipRepository.findByPersonId(context.resourceId);
        attributes.relationshipCount = relationships?.length ?? 0;
      }
    }

    // Try to determine user role for rules that need it
    if (tree) {
      if (tree.ownerId === context.userId) {
        attributes.userRole = 'owner';
      } else {
        const collaborator = tree.collaborators?.find(c => c.userId === context.userId);
        if (collaborator) {
          attributes.userRole = collaborator.permission;
        }
      }
    }

    return attributes;
  }

  addRule(rule: AttributeRule): void {
    this.rules.push(rule);
  }
}
