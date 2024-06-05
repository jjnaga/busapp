export type BULL_JOB_STATUS = 'success' | 'failed';

export interface BULL_JOB_RESULT {
  status: BULL_JOB_STATUS;
  message: string;
  data?: object;
}
