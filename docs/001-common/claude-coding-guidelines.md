# Claude Interaction Guidelines

## Standard Development Workflow

### Before Starting Any Coding Task
1. Review `/001-common/claude-coding-guidelines.md`
2. Understand the project context from:
   - `/002-modules/multi-saas-platform/backend/requirements.md`
   - `/001-common/architecture.md`
   - `/006-references/architecture/multi-tenant-design.md`

### Code Generation Checklist
- [ ] Follow DRY principles
- [ ] Apply YAGNI approach
- [ ] Maintain KISS methodology
- [ ] Ensure single responsibility
- [ ] Use consistent naming conventions
- [ ] Implement proper TypeScript typing
- [ ] Add comprehensive error handling
- [ ] Write clear, explanatory comments
- [ ] Optimize for performance

### Documentation Requirements
- Always generate or update relevant documentation
- Add inline documentation for complex logic
- Update architecture documents if significant changes occur

## Prompt Templates for Code Generation
- "Generate a NestJS module following our coding guidelines"
- "Implement a service method with error handling and logging"
- "Create a repository with efficient query methods"

## Continuous Improvement Prompt
"Review the previous implementation against our coding guidelines and suggest improvements."
