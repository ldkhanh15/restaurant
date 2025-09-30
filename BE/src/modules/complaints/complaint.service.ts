import { Complaint, User, Order, Employee } from "../../models/index";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import {
  CreateComplaintDTO,
  UpdateComplaintDTO,
  ComplaintEscalationDTO,
  ComplaintResolutionDTO,
} from "../../types/dtos/complaint.dto";
import { NotificationService } from "../notifications/notification.service";

export const ComplaintService = {
  async list(filters?: {
    status?: string;
    priority?: string;
    category?: string;
  }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.category) where.category = filters.category;

    return Complaint.findAll({
      where,
      include: [
        "user",
        {
          model: Order,
          attributes: ["id", "order_number", "created_at"],
        },
        {
          model: Employee,
          as: "assigned_employee",
          attributes: ["id", "full_name", "position"],
        },
      ],
      order: [
        ["priority", "DESC"],
        ["created_at", "DESC"],
      ],
    });
  },

  async get(id: string) {
    return Complaint.findByPk(id, {
      include: [
        "user",
        {
          model: Order,
          attributes: ["id", "order_number", "created_at"],
        },
        {
          model: Employee,
          as: "assigned_employee",
          attributes: ["id", "full_name", "position"],
        },
      ],
    });
  },

  async create(payload: CreateComplaintDTO) {
    const id = payload.id || uuidv4();

    // Set default priority based on category if not provided
    if (!payload.priority) {
      payload.priority = this.determinePriority(payload.category);
    }

    const complaint = await Complaint.create({
      id,
      ...payload,
      status: payload.status || "pending",
      created_at: new Date(),
    });

    // Notify customer service team
    await NotificationService.create({
      user_id: "customer_service", // Assuming there's a customer service notification channel
      title: "New Complaint Filed",
      message: `New ${payload.priority} priority complaint: ${payload.subject}`,
      type: "new_complaint",
      data: {
        complaint_id: complaint.id,
        priority: payload.priority,
      },
    });

    return this.get(complaint.id);
  },

  async update(id: string, payload: UpdateComplaintDTO) {
    const complaint = await Complaint.findByPk(id);
    if (!complaint) return null;

    const oldStatus = complaint.status;
    await complaint.update({
      ...payload,
      updated_at: new Date(),
    });

    // Notify user about status changes
    if (payload.status && payload.status !== oldStatus) {
      await NotificationService.create({
        user_id: complaint.user_id,
        title: "Complaint Status Updated",
        message: `Your complaint status has been updated to ${payload.status}`,
        type: "complaint_status",
        data: {
          complaint_id: complaint.id,
          old_status: oldStatus,
          new_status: payload.status,
        },
      });
    }

    // Notify assigned employee
    if (payload.assigned_to && payload.assigned_to !== complaint.assigned_to) {
      await NotificationService.create({
        user_id: payload.assigned_to,
        title: "Complaint Assigned",
        message: `A complaint has been assigned to you: ${complaint.subject}`,
        type: "complaint_assignment",
        data: {
          complaint_id: complaint.id,
        },
      });
    }

    return this.get(id);
  },

  async escalate(payload: ComplaintEscalationDTO) {
    const complaint = await Complaint.findByPk(payload.complaint_id);
    if (!complaint) throw new Error("Complaint not found");

    // Update complaint with escalation details
    await complaint.update({
      priority: payload.priority_change || "high",
      status: "escalated",
      metadata: {
        ...complaint.metadata,
        escalation: {
          reason: payload.escalation_reason,
          escalated_by: payload.escalated_by,
          escalated_to: payload.escalated_to,
          escalated_at: new Date(),
          deadline: payload.deadline,
        },
      },
      updated_at: new Date(),
    });

    // Notify relevant parties
    await Promise.all([
      // Notify the person to whom it's escalated
      NotificationService.create({
        user_id: payload.escalated_to,
        title: "Complaint Escalated",
        message: `A complaint has been escalated to you: ${complaint.subject}`,
        type: "complaint_escalation",
        data: {
          complaint_id: complaint.id,
          reason: payload.escalation_reason,
        },
      }),
      // Notify the customer
      NotificationService.create({
        user_id: complaint.user_id,
        title: "Complaint Escalated",
        message: "Your complaint has been escalated for priority handling",
        type: "complaint_escalation",
        data: {
          complaint_id: complaint.id,
        },
      }),
    ]);

    return this.get(complaint.id);
  },

  async resolve(payload: ComplaintResolutionDTO) {
    const complaint = await Complaint.findByPk(payload.complaint_id);
    if (!complaint) throw new Error("Complaint not found");

    await complaint.update({
      status: "resolved",
      resolution: payload.resolution,
      resolution_time: new Date(),
      metadata: {
        ...complaint.metadata,
        resolution: {
          resolved_by: payload.resolved_by,
          compensation_offered: payload.compensation_offered,
          actions_taken: payload.actions_taken,
          preventive_measures: payload.preventive_measures,
        },
      },
      updated_at: new Date(),
    });

    // Notify customer about resolution
    await NotificationService.create({
      user_id: complaint.user_id,
      title: "Complaint Resolved",
      message: "Your complaint has been resolved",
      type: "complaint_resolution",
      data: {
        complaint_id: complaint.id,
        resolution: payload.resolution,
        compensation: payload.compensation_offered,
      },
    });

    return this.get(complaint.id);
  },

  async getStats(startDate?: Date, endDate?: Date) {
    const whereClause =
      startDate && endDate
        ? {
            created_at: {
              [Op.between]: [startDate, endDate],
            },
          }
        : {};

    const [
      totalComplaints,
      complaintsByStatus,
      complaintsByPriority,
      complaintsByCategory,
      averageResolutionTime,
    ] = await Promise.all([
      Complaint.count({ where: whereClause }),
      Complaint.count({
        where: whereClause,
        group: ["status"],
      }),
      Complaint.count({
        where: whereClause,
        group: ["priority"],
      }),
      Complaint.count({
        where: whereClause,
        group: ["category"],
      }),
      Complaint.findAll({
        where: {
          ...whereClause,
          status: "resolved",
          resolution_time: { [Op.not]: null },
        },
        attributes: [
          [
            fn(
              "AVG",
              fn("EXTRACT", literal("EPOCH FROM resolution_time - created_at"))
            ),
            "avg_resolution_time",
          ],
        ],
      }),
    ]);

    return {
      total_complaints: totalComplaints,
      status_distribution: complaintsByStatus,
      priority_distribution: complaintsByPriority,
      category_distribution: complaintsByCategory,
      average_resolution_time:
        averageResolutionTime[0]?.getDataValue("avg_resolution_time") || 0,
      resolution_rate:
        (complaintsByStatus.find((s) => s.status === "resolved")?.count || 0) /
        totalComplaints,
    };
  },

  determinePriority(category: string): "low" | "medium" | "high" | "urgent" {
    const priorityMap: { [key: string]: "low" | "medium" | "high" | "urgent" } =
      {
        food_safety: "urgent",
        health_concern: "urgent",
        service_quality: "high",
        order_issue: "medium",
        billing_issue: "medium",
        general_feedback: "low",
      };

    return priorityMap[category] || "medium";
  },
};
