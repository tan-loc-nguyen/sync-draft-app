export interface Document {
  id: string,
  ownerId: string,
  title: string,
  content: string | null,
  createdAt: Date,
  updatedAt: Date
}
