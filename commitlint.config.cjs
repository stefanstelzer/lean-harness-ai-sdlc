/**
 * Conventional Commits configuration.
 * See WORKFLOW.md — every commit on every flow follows this convention so the
 * changelog and release pipeline can be generated automatically.
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
        'adr',
      ],
    ],
  },
};
