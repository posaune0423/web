declare module "idle-task" {
  export const setIdleTask: (task: IdleTaskFunction, options?: SetIdleTaskOptions) => IdleTaskKey;
}
