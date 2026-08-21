import type { FamilyRelationProofFile } from './familyRelationProofHelpers';

let pendingFiles: FamilyRelationProofFile[] = [];

export function pushPendingFamilyRelationProofCapture(files: FamilyRelationProofFile[]) {
  pendingFiles = files.slice();
}

export function consumePendingFamilyRelationProofCapture(): FamilyRelationProofFile[] {
  const files = pendingFiles;
  pendingFiles = [];
  return files;
}
