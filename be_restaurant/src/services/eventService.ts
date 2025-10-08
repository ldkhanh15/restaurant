import { BaseService } from "./baseService"
import Event from "../models/Event"
import { stat } from "fs"

class EventService extends BaseService<Event> {
  constructor() {
    super(Event)
  }
  
}

export default new EventService()
