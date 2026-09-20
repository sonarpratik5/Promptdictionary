export type PromptVariable = {
  name: string;
  label: string;
  description: string;
  defaultValue?: string;
  required?: boolean;
};

export type Prompt = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  template: string;
  useCase: string;
  tags: string[];
  compatibleModels: string[];
  testedAt?: string;
  variables: PromptVariable[];
  limitations: string;
  sampleInput?: string;
  sampleOutput?: string;
};
