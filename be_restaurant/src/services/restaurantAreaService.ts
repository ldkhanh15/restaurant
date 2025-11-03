import { BaseService } from "./baseService";
import RestaurantArea from "../models/MasterRestaurantArea";

class RestaurantAreaService extends BaseService<RestaurantArea> {
  constructor() {
    super(RestaurantArea);
  }

  async findOne() {
    const area = await this.model.findOne({
      order: [["created_at", "ASC"]], 
    });

    if (!area) {
      throw new Error("Restaurant area not found");
    }

    return area;
  }
}

export default new RestaurantAreaService();
