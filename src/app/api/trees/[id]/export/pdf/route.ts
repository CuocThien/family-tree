import { NextResponse } from 'next/server';
import { exportTreeAsPDF, getPDFFilename } from '@/lib/tree-export/pdf-export';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { container } from '@/lib/di';

export const GET = withAuth(async (
  request: AuthenticatedRequest,
  context: { params: Promise<Record<string, string>> }
) => {
  try {
    const params = await context.params;
    const id = params.id;

    // Get tree data
    const tree = await container.treeService.getTreeById(id, request.user.id);

    if (!tree) {
      return NextResponse.json({ error: 'Tree not found' }, { status: 404 });
    }

    // Get persons and relationships for the tree
    const [persons, relationships] = await Promise.all([
      fetch(new URL(`/api/trees/${id}/persons?limit=1000`, request.url)).then(r => r.json()),
      fetch(new URL(`/api/trees/${id}/relationships?limit=1000`, request.url)).then(r => r.json()),
    ]);

    const pdfBuffer = await exportTreeAsPDF(
      tree,
      persons.data || [],
      (relationships.data || [])
    );

    const filename = getPDFFilename(tree.name, tree._id);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: 'Failed to export PDF' },
      { status: 500 }
    );
  }
});
