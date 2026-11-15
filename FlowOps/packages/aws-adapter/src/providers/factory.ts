import {
  WorkflowExecutionProvider,
  StepFunctionsExecutionProvider,
} from './workflow-execution-provider.js';

let defaultProviderInstance: WorkflowExecutionProvider | null = null;

export function getWorkflowExecutionProvider(): WorkflowExecutionProvider {
  if (!defaultProviderInstance) {
    defaultProviderInstance = new StepFunctionsExecutionProvider();
  }
  return defaultProviderInstance;
}
