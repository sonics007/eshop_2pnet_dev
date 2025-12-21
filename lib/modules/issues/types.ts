export type IssueStatus = 'new' | 'in_progress' | 'resolved';

export interface IssueRecord {
  id: number;
  title: string;
  description?: string | null;
  createdBy: string;
  resolvedBy?: string | null;
  resolutionNote?: string | null;
  resolutionReplies?: IssueReply[];
  resolutionLocked?: boolean;
  status: IssueStatus;
  priority: number; // 1 (low) - 5 (high)
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export interface IssueCreateInput {
  title: string;
  description?: string;
  priority?: number;
}

export interface IssueReply {
  author: string;
  text: string;
  at: string;
}

export interface IssueUpdateInput {
  status?: IssueStatus;
  priority?: number;
  resolvedBy?: string;
  resolutionNote?: string | null;
  newReply?: string;
  resolutionLocked?: boolean;
}
