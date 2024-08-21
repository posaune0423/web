import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'http://localhost:8080/graphql',
  documents: ['src/**/*.tsx'],
  ignoreNoDocuments: true,
  generates: {
    './src/libs/graphql/': {
      preset: 'client',
    },
  },
  hooks: {
    afterOneFileWrite: ['prettier --write'],
  },
}
export default config
