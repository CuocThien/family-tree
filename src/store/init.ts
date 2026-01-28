// Enable Immer plugins for Map/Set support
import { enableMapSet } from 'immer';

// This must be called before any stores that use Map/Set are created
enableMapSet();
