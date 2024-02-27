import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './graphql/schema.graphql',
  generates: {
    './graphql/types/graphql.d.ts': {
      plugins: ['typescript'],
      config: {
        addUnderscoreToArgsType: true,
      },
    },
  },
};
export default config;
