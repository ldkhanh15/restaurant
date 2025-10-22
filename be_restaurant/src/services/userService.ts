import { BaseService } from "./baseService";
import Employee from "../models/Employee";
import User from "../models/User";
import { hashPassword } from "../utils/password";
import { hash } from "crypto";
import { AppError } from "../middlewares/errorHandler";
import { AppConstants } from "../constants/AppConstants";

class UserService extends BaseService<User> {
  constructor() {
    super(User);
  }

  async create(data: User): Promise<User> {
    const username = data.username.trim();
    const existingUser = await this.model.findOne({ where: { username } });
    if (existingUser) {
      throw new AppError("User already exists", 409);
    }
    const email = data.email.trim();
    const existingEmail = await this.model.findOne({ where: { email } });
    if (existingEmail) {
      throw new AppError("Email already exists", 409);
    }
    const password_hash = await hashPassword(
      AppConstants.PASSWORD_DEFAULT.PASSWORD
    );
    return await this.model.create({
      ...data,
      username,
      email,
      password_hash,
    });
  }

  async findByIdWithEmployee(id: string) {
    return await this.findById(id, {
      include: [{ model: Employee, as: "employee" }],
    });
  }
}

export default new UserService();
