import apiClient from "./apiClient";

export interface UserBehaviorLogAttributes {
  id?: string;
  user_id: string;
  item_id?: string;
  action_type?: string;
  search_query?: string;
  timestamp?: Date;
}

export const userBehaviorService = {
  addBehavior: (userBehavior: UserBehaviorLogAttributes) =>
    apiClient.post("recommendations/user-behavior", userBehavior),
};

export default userBehaviorService;
