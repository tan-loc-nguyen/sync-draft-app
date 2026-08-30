export interface Merge {
  id: string,
  documentId: string,
  mergedById: string,
  before: string | null,
  after: string | null,
  mergedAt: Date,
  description: string | null
}
