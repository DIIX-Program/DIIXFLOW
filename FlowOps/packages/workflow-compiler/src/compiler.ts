import {
  ReactFlowGraph,
  CompilationResult,
} from '@flowops/contracts';
import { validateGraph, buildIR } from '@flowops/workflow-core';
import { generateASL, ASLCompilationOptions } from './asl.js';

/**
 * End-to-end compilation pipeline:
 * 1. Validate React Flow Graph (Kahn cycle detection, reachability, branch checks)
 * 2. Generate canonical Intermediate Representation (IR)
 * 3. Generate Amazon States Language (ASL) JSON definition
 */
export function compileWorkflow(
  graph: ReactFlowGraph,
  options?: ASLCompilationOptions
): CompilationResult {
  const startTime = Date.now();

  // Step 1: Validate Graph
  const validation = validateGraph(graph);
  if (!validation.isValid) {
    return {
      success: false,
      validation,
    };
  }

  // Step 2: Build IR
  const ir = buildIR(graph);

  // Step 3: Generate ASL State Machine
  const asl = generateASL(ir, options);

  const durationMs = Date.now() - startTime;

  return {
    success: true,
    asl,
    ir,
    validation,
    stats: {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      stateCount: Object.keys(asl.States).length,
      compilationTimeMs: durationMs,
    },
  };
}
