# AGENTS.md

## graphify

Before answering any codebase question, check `graphify-out/` for a knowledge graph.

- Read `graphify-out/GRAPH_REPORT.md` for architecture overview, god nodes, and surprising connections
- Run `graphify query "<question>"` for focused subgraph queries (much smaller than reading raw files)
- Run `graphify path "A" "B"` to find shortest path between two concepts
- Run `graphify explain "NodeName"` to understand a specific node and its connections
- Run `graphify --update` after code changes to keep the graph fresh (code-only changes are free, no LLM needed)
- Run `graphify . --cluster-only` to re-cluster without re-extracting

The graph is the map. Prefer graph queries over grepping raw files.
