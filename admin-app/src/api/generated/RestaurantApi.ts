/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface Notification {
  /**
   * @format uuid
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id?: string;
  /** @format uuid */
  user_id?: string | null;
  type?:
    | "low_stock"
    | "reservation_confirm"
    | "promotion"
    | "order_created"
    | "order_updated"
    | "order_status_changed"
    | "reservation_created"
    | "reservation_updated"
    | "chat_message"
    | "support_request"
    | "payment_completed"
    | "other";
  /** @example "Your order has been created successfully" */
  content?: string;
  /** @example "Order Created" */
  title?: string | null;
  data?: object | null;
  /** @default false */
  is_read?: boolean;
  /**
   * @format date-time
   * @example "2024-01-01T00:00:00Z"
   */
  sent_at?: string;
  /** @default "sent" */
  status?: "sent" | "failed";
}

export interface Order {
  /**
   * @format uuid
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id?: string;
  /** @format uuid */
  user_id?: string | null;
  /** @format uuid */
  reservation_id?: string | null;
  /** @format uuid */
  table_id?: string | null;
  /** @format uuid */
  table_group_id?: string | null;
  /** @format uuid */
  event_id?: string | null;
  /** @format uuid */
  voucher_id?: string | null;
  /** @example "pending" */
  status?:
    | "pending"
    | "dining"
    | "waiting_payment"
    | "preparing"
    | "ready"
    | "delivered"
    | "paid"
    | "cancelled";
  /**
   * @format decimal
   * @example 150.5
   */
  total_amount?: number;
  /**
   * @format decimal
   * @example 10
   */
  voucher_discount_amount?: number | null;
  /**
   * @format decimal
   * @example 140.5
   */
  final_amount?: number;
  /**
   * @format decimal
   * @example 5
   */
  event_fee?: number | null;
  /**
   * @format decimal
   * @example 20
   */
  deposit_amount?: number | null;
  customizations?: object | null;
  /** @example "Extra spicy" */
  notes?: string | null;
  /** @example "pending" */
  payment_status?: "pending" | "paid" | "failed";
  /** @example "cash" */
  payment_method?: "zalopay" | "momo" | "cash" | "vnpay" | null;
  /**
   * @format date-time
   * @example "2024-01-01T00:00:00Z"
   */
  created_at?: string;
  /**
   * @format date-time
   * @example "2024-01-01T00:00:00Z"
   */
  updated_at?: string;
  /** @format date-time */
  deleted_at?: string | null;
}

export interface Reservation {
  /**
   * @format uuid
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id?: string;
  /** @format uuid */
  user_id?: string | null;
  /** @format uuid */
  table_id?: string | null;
  /** @format uuid */
  table_group_id?: string | null;
  /**
   * @format date-time
   * @example "2024-01-01T19:00:00Z"
   */
  reservation_time?: string;
  /** @example 120 */
  duration_minutes?: number;
  /** @example 4 */
  num_people?: number;
  preferences?: object | null;
  /** @format uuid */
  event_id?: string | null;
  /**
   * @format decimal
   * @example 10
   */
  event_fee?: number | null;
  /** @example "pending" */
  status?: "pending" | "confirmed" | "cancelled" | "no_show";
  /** @example 15 */
  timeout_minutes?: number;
  /**
   * @format decimal
   * @example 50
   */
  deposit_amount?: number | null;
  pre_order_items?: object | null;
  /**
   * @format date-time
   * @example "2024-01-01T00:00:00Z"
   */
  created_at?: string;
  /**
   * @format date-time
   * @example "2024-01-01T00:00:00Z"
   */
  updated_at?: string;
  /** @format date-time */
  deleted_at?: string | null;
}

export interface Payment {
  /**
   * @format uuid
   * @example "123e4567-e89b-12d3-a456-426614174000"
   */
  id?: string;
  /** @format uuid */
  order_id?: string | null;
  /** @format uuid */
  reservation_id?: string | null;
  /**
   * @format decimal
   * @example 150.5
   */
  amount?: number;
  /** @example "cash" */
  method?: "cash" | "vnpay";
  /** @example "completed" */
  status?: "pending" | "completed" | "failed";
  /** @example "TXN123456789" */
  transaction_id?: string | null;
  /**
   * @format date-time
   * @example "2024-01-01T00:00:00Z"
   */
  created_at?: string;
  /**
   * @format date-time
   * @example "2024-01-01T00:00:00Z"
   */
  updated_at?: string;
}

export interface Pagination {
  /** @example 1 */
  page?: number;
  /** @example 10 */
  limit?: number;
  /** @example 100 */
  total?: number;
  /** @example 10 */
  pages?: number;
}

export interface Error {
  /** @example "error" */
  status?: string;
  /** @example "Error description" */
  message?: string;
  /** @example "ERROR_CODE" */
  code?: string;
  details?: object | null;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "http://10.0.235.235:8000/api",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Restaurant Backend API
 * @version 1.0.0
 * @license MIT (https://opensource.org/licenses/MIT)
 * @baseUrl http://localhost:3000/api
 * @contact Restaurant Backend Team <support@restaurant.com>
 *
 * API documentation for Restaurant Management System Backend.
 *
 * ## Authentication
 * This API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:
 * ```
 * Authorization: Bearer <your_jwt_token>
 * ```
 *
 * ## User Roles
 * - **customer**: Regular customers
 * - **employee**: Restaurant staff
 * - **admin**: System administrators
 *
 * ## WebSocket Support
 * The API supports real-time communication via Socket.IO:
 * - `/notifications` - Notification events
 * - `/order` - Order management events
 * - `/reservations` - Reservation events
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  notifications = {
    /**
     * @description Retrieve paginated list of notifications with optional filters
     *
     * @tags Notifications
     * @name NotificationsList
     * @summary Get all notifications with filters
     * @request GET:/notifications
     * @secure
     */
    notificationsList: (
      query?: {
        /**
         * Filter by user ID
         * @format uuid
         */
        user_id?: string;
        /** Filter by notification type */
        type?:
          | "low_stock"
          | "reservation_confirm"
          | "promotion"
          | "order_created"
          | "order_updated"
          | "order_status_changed"
          | "reservation_created"
          | "reservation_updated"
          | "chat_message"
          | "support_request"
          | "payment_completed"
          | "other";
        /** Filter by read status */
        is_read?: boolean;
        /**
         * Page number
         * @min 1
         * @default 1
         */
        page?: number;
        /**
         * Items per page
         * @min 1
         * @max 100
         * @default 10
         */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: {
            items?: Notification[];
            pagination?: Pagination;
          };
        },
        Error
      >({
        path: `/notifications`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new notification (admin/employee only)
     *
     * @tags Notifications
     * @name NotificationsCreate
     * @summary Create new notification
     * @request POST:/notifications
     * @secure
     */
    notificationsCreate: (
      data: {
        type:
          | "low_stock"
          | "reservation_confirm"
          | "promotion"
          | "order_created"
          | "order_updated"
          | "order_status_changed"
          | "reservation_created"
          | "reservation_updated"
          | "chat_message"
          | "support_request"
          | "payment_completed"
          | "other";
        /** @maxLength 200 */
        title?: string;
        /**
         * @minLength 1
         * @maxLength 1000
         */
        content: string;
        /** @format uuid */
        user_id?: string;
        data?: object;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Notification;
        },
        Error
      >({
        path: `/notifications`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve a specific notification by its ID
     *
     * @tags Notifications
     * @name NotificationsDetail
     * @summary Get notification by ID
     * @request GET:/notifications/{id}
     * @secure
     */
    notificationsDetail: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Notification;
        },
        Error
      >({
        path: `/notifications/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update an existing notification
     *
     * @tags Notifications
     * @name NotificationsUpdate
     * @summary Update notification
     * @request PUT:/notifications/{id}
     * @secure
     */
    notificationsUpdate: (
      id: string,
      data: {
        /** @maxLength 200 */
        title?: string;
        /**
         * @minLength 1
         * @maxLength 1000
         */
        content?: string;
        data?: object;
        is_read?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Notification;
        },
        Error
      >({
        path: `/notifications/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a notification
     *
     * @tags Notifications
     * @name NotificationsDelete
     * @summary Delete notification
     * @request DELETE:/notifications/{id}
     * @secure
     */
    notificationsDelete: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          /** @example "Notification deleted successfully" */
          message?: string;
        },
        Error
      >({
        path: `/notifications/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get the count of unread notifications for current user
     *
     * @tags Notifications
     * @name UnreadCountList
     * @summary Get unread notification count
     * @request GET:/notifications/unread/count
     * @secure
     */
    unreadCountList: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: {
            /** @example 5 */
            count?: number;
          };
        },
        Error
      >({
        path: `/notifications/unread/count`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get list of unread notifications for current user
     *
     * @tags Notifications
     * @name UnreadListList
     * @summary Get unread notifications
     * @request GET:/notifications/unread/list
     * @secure
     */
    unreadListList: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Notification[];
        },
        Error
      >({
        path: `/notifications/unread/list`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get notification statistics (admin/employee only)
     *
     * @tags Notifications
     * @name StatsList
     * @summary Get notification statistics
     * @request GET:/notifications/stats
     * @secure
     */
    statsList: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object;
        },
        Error
      >({
        path: `/notifications/stats`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get recent notifications (admin/employee only)
     *
     * @tags Notifications
     * @name RecentList
     * @summary Get recent notifications
     * @request GET:/notifications/recent
     * @secure
     */
    recentList: (
      query?: {
        /**
         * Number of notifications to return
         * @min 1
         * @max 100
         * @default 20
         */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Notification[];
        },
        Error
      >({
        path: `/notifications/recent`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get notifications filtered by type (admin/employee only)
     *
     * @tags Notifications
     * @name TypeDetail
     * @summary Get notifications by type
     * @request GET:/notifications/type/{type}
     * @secure
     */
    typeDetail: (
      type:
        | "low_stock"
        | "reservation_confirm"
        | "promotion"
        | "order_created"
        | "order_updated"
        | "order_status_changed"
        | "reservation_created"
        | "reservation_updated"
        | "chat_message"
        | "support_request"
        | "payment_completed"
        | "other",
      query?: {
        /**
         * Number of notifications to return
         * @min 1
         * @max 100
         * @default 50
         */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Notification[];
        },
        Error
      >({
        path: `/notifications/type/${type}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark a specific notification as read
     *
     * @tags Notifications
     * @name ReadPartialUpdate
     * @summary Mark notification as read
     * @request PATCH:/notifications/{id}/read
     * @secure
     */
    readPartialUpdate: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Notification;
        },
        Error
      >({
        path: `/notifications/${id}/read`,
        method: "PATCH",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Mark all notifications as read for current user
     *
     * @tags Notifications
     * @name ReadAllPartialUpdate
     * @summary Mark all notifications as read
     * @request PATCH:/notifications/read-all
     * @secure
     */
    readAllPartialUpdate: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object;
        },
        Error
      >({
        path: `/notifications/read-all`,
        method: "PATCH",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete notifications older than specified days (admin/employee only)
     *
     * @tags Notifications
     * @name CleanupDelete
     * @summary Delete old notifications
     * @request DELETE:/notifications/cleanup
     * @secure
     */
    cleanupDelete: (
      data?: {
        /**
         * @min 1
         * @default 30
         */
        days_old?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: {
            deleted_count?: number;
          };
        },
        Error
      >({
        path: `/notifications/cleanup`,
        method: "DELETE",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  orders = {
    /**
     * @description Retrieve paginated list of orders with optional filters (admin/employee only)
     *
     * @tags Orders
     * @name OrdersList
     * @summary Get all orders with filters
     * @request GET:/orders
     * @secure
     */
    ordersList: (
      query?: {
        /**
         * Filter by date
         * @format date
         */
        date?: string;
        /** Filter by order status */
        status?:
          | "pending"
          | "preparing"
          | "ready"
          | "delivered"
          | "paid"
          | "cancelled";
        /**
         * Filter by user ID
         * @format uuid
         */
        user_id?: string;
        /**
         * Filter by table ID
         * @format uuid
         */
        table_id?: string;
        /**
         * Page number
         * @min 1
         * @default 1
         */
        page?: number;
        /**
         * Items per page
         * @min 1
         * @max 100
         * @default 10
         */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: {
            items?: Order[];
            pagination?: Pagination;
          };
        },
        Error
      >({
        path: `/orders`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new order
     *
     * @tags Orders
     * @name OrdersCreate
     * @summary Create new order
     * @request POST:/orders
     * @secure
     */
    ordersCreate: (
      data: {
        /**
         * Table ID for the order
         * @format uuid
         */
        table_id: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Order;
        },
        Error
      >({
        path: `/orders`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve a specific order by its ID
     *
     * @tags Orders
     * @name OrdersDetail
     * @summary Get order by ID
     * @request GET:/orders/{id}
     * @secure
     */
    ordersDetail: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Order;
        },
        Error
      >({
        path: `/orders/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update an existing order
     *
     * @tags Orders
     * @name OrdersUpdate
     * @summary Update order
     * @request PUT:/orders/{id}
     * @secure
     */
    ordersUpdate: (
      id: string,
      data: {
        /** @format uuid */
        table_id?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Order;
        },
        Error
      >({
        path: `/orders/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve order for a specific table
     *
     * @tags Orders
     * @name TableDetail
     * @summary Get order by table
     * @request GET:/orders/table/{tableId}
     * @secure
     */
    tableDetail: (
      tableId: string,
      query?: {
        /** Filter by order status */
        status?:
          | "pending"
          | "preparing"
          | "ready"
          | "delivered"
          | "paid"
          | "cancelled";
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Order;
        },
        Error
      >({
        path: `/orders/table/${tableId}`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update the status of an order (admin/employee only)
     *
     * @tags Orders
     * @name StatusPartialUpdate
     * @summary Update order status
     * @request PATCH:/orders/{id}/status
     * @secure
     */
    statusPartialUpdate: (
      id: string,
      data: {
        status:
          | "pending"
          | "preparing"
          | "ready"
          | "delivered"
          | "paid"
          | "cancelled";
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Order;
        },
        Error
      >({
        path: `/orders/${id}/status`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Add a new item to an existing order
     *
     * @tags Orders
     * @name ItemsCreate
     * @summary Add item to order
     * @request POST:/orders/{id}/items
     * @secure
     */
    itemsCreate: (
      id: string,
      data: {
        /** @format uuid */
        dish_id: string;
        /** @min 1 */
        quantity: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Order;
        },
        Error
      >({
        path: `/orders/${id}/items`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update the quantity of an order item
     *
     * @tags Orders
     * @name ItemsQuantityPartialUpdate
     * @summary Update item quantity
     * @request PATCH:/orders/items/{itemId}/quantity
     * @secure
     */
    itemsQuantityPartialUpdate: (
      itemId: string,
      data: {
        /** @min 0 */
        quantity: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object;
        },
        Error
      >({
        path: `/orders/items/${itemId}/quantity`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Update the status of an order item (admin/employee only)
     *
     * @tags Orders
     * @name ItemsStatusPartialUpdate
     * @summary Update item status
     * @request PATCH:/orders/items/{itemId}/status
     * @secure
     */
    itemsStatusPartialUpdate: (
      itemId: string,
      data: {
        status: "pending" | "completed";
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object;
        },
        Error
      >({
        path: `/orders/items/${itemId}/status`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete an item from an order
     *
     * @tags Orders
     * @name ItemsDelete
     * @summary Delete item
     * @request DELETE:/orders/items/{itemId}
     * @secure
     */
    itemsDelete: (itemId: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Order;
        },
        Error
      >({
        path: `/orders/items/${itemId}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Apply a voucher to an order
     *
     * @tags Orders
     * @name VoucherCreate
     * @summary Apply voucher
     * @request POST:/orders/{id}/voucher
     * @secure
     */
    voucherCreate: (
      id: string,
      data: {
        /** Voucher code */
        code: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Order;
        },
        Error
      >({
        path: `/orders/${id}/voucher`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Remove voucher from an order
     *
     * @tags Orders
     * @name VoucherDelete
     * @summary Remove voucher
     * @request DELETE:/orders/{id}/voucher
     * @secure
     */
    voucherDelete: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Order;
        },
        Error
      >({
        path: `/orders/${id}/voucher`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Merge two orders (admin/employee only)
     *
     * @tags Orders
     * @name MergeCreate
     * @summary Merge orders
     * @request POST:/orders/merge
     * @secure
     */
    mergeCreate: (
      data: {
        /** @format uuid */
        source_order_id: string;
        /** @format uuid */
        target_order_id: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Order;
        },
        Error
      >({
        path: `/orders/merge`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Request support for an order
     *
     * @tags Orders
     * @name SupportCreate
     * @summary Request support
     * @request POST:/orders/{id}/support
     * @secure
     */
    supportCreate: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object;
        },
        Error
      >({
        path: `/orders/${id}/support`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Request payment for an order
     *
     * @tags Orders
     * @name PaymentRequestCreate
     * @summary Request payment
     * @request POST:/orders/{id}/payment/request
     * @secure
     */
    paymentRequestCreate: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object;
        },
        Error
      >({
        path: `/orders/${id}/payment/request`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get revenue statistics for orders (admin/employee only)
     *
     * @tags Orders
     * @name StatsRevenueList
     * @summary Get revenue statistics
     * @request GET:/orders/stats/revenue
     * @secure
     */
    statsRevenueList: (
      query: {
        /** @format date */
        start_date: string;
        /** @format date */
        end_date: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object;
        },
        Error
      >({
        path: `/orders/stats/revenue`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
  reservations = {
    /**
     * @description Retrieve paginated list of reservations with optional filters (admin/employee only)
     *
     * @tags Reservations
     * @name ReservationsList
     * @summary Get all reservations with filters
     * @request GET:/reservations
     * @secure
     */
    reservationsList: (
      query?: {
        /**
         * Filter by date
         * @format date
         */
        date?: string;
        /** Filter by reservation status */
        status?: "pending" | "confirmed" | "cancelled" | "no_show";
        /**
         * Filter by table ID
         * @format uuid
         */
        table_id?: string;
        /**
         * Filter by user ID
         * @format uuid
         */
        user_id?: string;
        /**
         * Filter by event ID
         * @format uuid
         */
        event_id?: string;
        /**
         * Page number
         * @min 1
         * @default 1
         */
        page?: number;
        /**
         * Items per page
         * @min 1
         * @max 100
         * @default 10
         */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: {
            items?: Reservation[];
            pagination?: Pagination;
          };
        },
        Error
      >({
        path: `/reservations`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Create a new reservation
     *
     * @tags Reservations
     * @name ReservationsCreate
     * @summary Create new reservation
     * @request POST:/reservations
     * @secure
     */
    reservationsCreate: (
      data: {
        /** @format uuid */
        table_id: string;
        /** @format date-time */
        reservation_time: string;
        /**
         * @min 30
         * @max 480
         * @default 90
         */
        duration_minutes?: number;
        /**
         * @min 1
         * @max 50
         */
        num_people: number;
        preferences?: object;
        /** @format uuid */
        event_id?: string;
        pre_order_items?: {
          /** @format uuid */
          dish_id?: string;
          /** @min 1 */
          quantity?: number;
        }[];
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Reservation;
        },
        Error
      >({
        path: `/reservations`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve a specific reservation by its ID
     *
     * @tags Reservations
     * @name ReservationsDetail
     * @summary Get reservation by ID
     * @request GET:/reservations/{id}
     * @secure
     */
    reservationsDetail: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Reservation;
        },
        Error
      >({
        path: `/reservations/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update an existing reservation
     *
     * @tags Reservations
     * @name ReservationsUpdate
     * @summary Update reservation
     * @request PUT:/reservations/{id}
     * @secure
     */
    reservationsUpdate: (
      id: string,
      data: {
        /** @format uuid */
        table_id?: string;
        /** @format date-time */
        reservation_time?: string;
        /**
         * @min 30
         * @max 480
         */
        duration_minutes?: number;
        /**
         * @min 1
         * @max 50
         */
        num_people?: number;
        preferences?: object;
        /** @format uuid */
        event_id?: string;
        pre_order_items?: {
          /** @format uuid */
          dish_id?: string;
          /** @min 1 */
          quantity?: number;
        }[];
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Reservation;
        },
        Error
      >({
        path: `/reservations/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Delete a reservation
     *
     * @tags Reservations
     * @name ReservationsDelete
     * @summary Delete reservation
     * @request DELETE:/reservations/{id}
     * @secure
     */
    reservationsDelete: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          /** @example "Reservation deleted successfully" */
          message?: string;
        },
        Error
      >({
        path: `/reservations/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Update the status of a reservation (admin/employee only)
     *
     * @tags Reservations
     * @name StatusPartialUpdate
     * @summary Update reservation status
     * @request PATCH:/reservations/{id}/status
     * @secure
     */
    statusPartialUpdate: (
      id: string,
      data: {
        status: "pending" | "confirmed" | "cancelled" | "no_show";
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Reservation;
        },
        Error
      >({
        path: `/reservations/${id}/status`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Check-in a reservation
     *
     * @tags Reservations
     * @name CheckinCreate
     * @summary Check-in reservation
     * @request POST:/reservations/{id}/checkin
     * @secure
     */
    checkinCreate: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object;
        },
        Error
      >({
        path: `/reservations/${id}/checkin`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  payments = {
    /**
     * @description Retrieve paginated list of payments (admin only)
     *
     * @tags Payments
     * @name PaymentsList
     * @summary Get all payments
     * @request GET:/payments
     * @secure
     */
    paymentsList: (
      query?: {
        /**
         * Page number
         * @min 1
         * @default 1
         */
        page?: number;
        /**
         * Items per page
         * @min 1
         * @max 100
         * @default 10
         */
        limit?: number;
        /** Filter by payment method */
        method?: "cash" | "vnpay";
        /** Filter by payment status */
        status?: "pending" | "completed" | "failed";
        /**
         * Filter by user ID
         * @format uuid
         */
        user_id?: string;
        /**
         * Filter by start date
         * @format date
         */
        start_date?: string;
        /**
         * Filter by end date
         * @format date
         */
        end_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Payment[];
          pagination?: {
            page?: number;
            limit?: number;
            total?: number;
            pages?: number;
          };
        },
        Error
      >({
        path: `/payments`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Retrieve a specific payment by its ID (admin only)
     *
     * @tags Payments
     * @name PaymentsDetail
     * @summary Get payment by ID
     * @request GET:/payments/{id}
     * @secure
     */
    paymentsDetail: (id: string, params: RequestParams = {}) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: Payment;
        },
        Error
      >({
        path: `/payments/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description VNPay callback URL for payment return
     *
     * @tags Payments
     * @name VnpayReturnList
     * @summary VNPay return URL
     * @request GET:/payments/vnpay/return
     */
    vnpayReturnList: (
      query?: {
        /** Transaction reference */
        vnp_TxnRef?: string;
        /** Response code from VNPay */
        vnp_ResponseCode?: string;
        /** Transaction status */
        vnp_TransactionStatus?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<any, void>({
        path: `/payments/vnpay/return`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * @description VNPay Instant Payment Notification
     *
     * @tags Payments
     * @name VnpayIpnCreate
     * @summary VNPay IPN
     * @request POST:/payments/vnpay/ipn
     */
    vnpayIpnCreate: (
      data: {
        vnp_TxnRef?: string;
        vnp_ResponseCode?: string;
        vnp_TransactionStatus?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "00" */
          RspCode?: string;
          /** @example "Success" */
          Message?: string;
        },
        any
      >({
        path: `/payments/vnpay/ipn`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Get revenue statistics (admin only)
     *
     * @tags Payments
     * @name StatsRevenueList
     * @summary Get revenue statistics
     * @request GET:/payments/stats/revenue
     * @secure
     */
    statsRevenueList: (
      query?: {
        /**
         * Start date for statistics
         * @format date
         */
        start_date?: string;
        /**
         * End date for statistics
         * @format date
         */
        end_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object;
        },
        Error
      >({
        path: `/payments/stats/revenue`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get order statistics (admin only)
     *
     * @tags Payments
     * @name StatsOrdersList
     * @summary Get order statistics
     * @request GET:/payments/stats/orders
     * @secure
     */
    statsOrdersList: (
      query?: {
        /**
         * Start date for statistics
         * @format date
         */
        start_date?: string;
        /**
         * End date for statistics
         * @format date
         */
        end_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object;
        },
        Error
      >({
        path: `/payments/stats/orders`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get reservation statistics (admin only)
     *
     * @tags Payments
     * @name StatsReservationsList
     * @summary Get reservation statistics
     * @request GET:/payments/stats/reservations
     * @secure
     */
    statsReservationsList: (
      query?: {
        /**
         * Start date for statistics
         * @format date
         */
        start_date?: string;
        /**
         * End date for statistics
         * @format date
         */
        end_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object;
        },
        Error
      >({
        path: `/payments/stats/reservations`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get payment statistics (admin only)
     *
     * @tags Payments
     * @name StatsPaymentsList
     * @summary Get payment statistics
     * @request GET:/payments/stats/payments
     * @secure
     */
    statsPaymentsList: (
      query?: {
        /**
         * Start date for statistics
         * @format date
         */
        start_date?: string;
        /**
         * End date for statistics
         * @format date
         */
        end_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object;
        },
        Error
      >({
        path: `/payments/stats/payments`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get table revenue statistics (admin only)
     *
     * @tags Payments
     * @name StatsTablesList
     * @summary Get table revenue statistics
     * @request GET:/payments/stats/tables
     * @secure
     */
    statsTablesList: (
      query?: {
        /**
         * Start date for statistics
         * @format date
         */
        start_date?: string;
        /**
         * End date for statistics
         * @format date
         */
        end_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object[];
        },
        Error
      >({
        path: `/payments/stats/tables`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get customer spending statistics (admin only)
     *
     * @tags Payments
     * @name StatsCustomersList
     * @summary Get customer spending statistics
     * @request GET:/payments/stats/customers
     * @secure
     */
    statsCustomersList: (
      query?: {
        /**
         * Start date for statistics
         * @format date
         */
        start_date?: string;
        /**
         * End date for statistics
         * @format date
         */
        end_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object[];
        },
        Error
      >({
        path: `/payments/stats/customers`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get daily revenue statistics (admin only)
     *
     * @tags Payments
     * @name StatsDailyList
     * @summary Get daily revenue statistics
     * @request GET:/payments/stats/daily
     * @secure
     */
    statsDailyList: (
      query: {
        /** @format date */
        start_date: string;
        /** @format date */
        end_date: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object[];
        },
        Error
      >({
        path: `/payments/stats/daily`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get monthly revenue statistics (admin only)
     *
     * @tags Payments
     * @name StatsMonthlyList
     * @summary Get monthly revenue statistics
     * @request GET:/payments/stats/monthly
     * @secure
     */
    statsMonthlyList: (
      query: {
        /** @format date */
        start_date: string;
        /** @format date */
        end_date: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object[];
        },
        Error
      >({
        path: `/payments/stats/monthly`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get dish statistics (admin only)
     *
     * @tags Payments
     * @name StatsDishesList
     * @summary Get dish statistics
     * @request GET:/payments/stats/dishes
     * @secure
     */
    statsDishesList: (
      query?: {
        /**
         * Start date for statistics
         * @format date
         */
        start_date?: string;
        /**
         * End date for statistics
         * @format date
         */
        end_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: object[];
        },
        Error
      >({
        path: `/payments/stats/dishes`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Get comprehensive dashboard overview (admin only)
     *
     * @tags Payments
     * @name StatsDashboardList
     * @summary Get dashboard overview
     * @request GET:/payments/stats/dashboard
     * @secure
     */
    statsDashboardList: (
      query?: {
        /**
         * Start date for statistics
         * @format date
         */
        start_date?: string;
        /**
         * End date for statistics
         * @format date
         */
        end_date?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<
        {
          /** @example "success" */
          status?: string;
          data?: {
            revenue?: object;
            orders?: object;
            reservations?: object;
            payments?: object;
            top_tables?: object[];
            top_customers?: object[];
            top_dishes?: object[];
          };
        },
        Error
      >({
        path: `/payments/stats/dashboard`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
