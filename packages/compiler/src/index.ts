/**
 * FlowOps Workflow Compiler Package
 */

import { ReactFlowGraph, ASLStateMachine, ValidationResult } from './types';
import { validateGraph } from './validation';
import { buildIntermediateRepresentation } from './ir';
import { compileToASL, ASLCompilerOptions } from './asl';

export * from './types';
export * from './validation';
export * from './ir';
export * from './asl';

export interface CompilationResult {
  success: boolean;
  validation: ValidationResult;
  asl?: ASLStateMachine;
}

export function compileWorkflow(
  graph: ReactFlowGraph,
  options?: ASLCompilerOptions
): CompilationResult {
  const validation = validateGraph(graph);

  if (!validation.isValid) {
    return {
      success: false,
      validation,
    };
  }

  const ir = buildIntermediateRepresentation(graph);
  const asl = compileToASL(ir, options);

  return {
    success: true,
    validation,
    asl,
  };
}
