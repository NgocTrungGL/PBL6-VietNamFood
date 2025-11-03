declare module "@react-navigation/stack" {
  // Minimal StackScreenProps substitute to satisfy imports in the project.
  // Adjust as needed for stronger typing if you later install @react-navigation/stack types.
  export type StackScreenProps<
    ParamList extends Record<string, any>,
    RouteName extends keyof ParamList = keyof ParamList
  > = {
    navigation: any;
    route: { params: ParamList[RouteName] };
  };
}
