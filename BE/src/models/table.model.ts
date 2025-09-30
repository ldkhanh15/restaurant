import { DataTypes, Model, Optional, Sequelize } from 'sequelize';

export interface TableAttributes {
  id: string;
  table_number: string;
  capacity: number;
  book_minutes?: number;
  deposit?: number;
  cancel_minutes?: number;
  location?: string | null;
  status?: 'available' | 'occupied' | 'cleaning' | 'reserved';
  panorama_urls?: object | null;
  amenities?: object | null;
  description?: string | null;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}
type TableCreation = Optional<TableAttributes, 'id'|'book_minutes'|'deposit'|'cancel_minutes'|'location'|'status'|'panorama_urls'|'amenities'|'description'|'created_at'|'updated_at'|'deleted_at'>;

export class Table extends Model<TableAttributes, TableCreation> implements TableAttributes {
  public id!: string;
  public table_number!: string;
  public capacity!: number;
  public book_minutes!: number;
  public deposit!: number;
  public cancel_minutes!: number;
  public location!: string | null;
  public status!: 'available' | 'occupied' | 'cleaning' | 'reserved';
  public panorama_urls!: object | null;
  public amenities!: object | null;
  public description!: string | null;
  public created_at!: Date;
  public updated_at!: Date;
  public deleted_at!: Date | null;
}

export function initTableModel(sequelize: Sequelize) {
  Table.init({
    id: { type: DataTypes.CHAR(36), primaryKey: true },
    table_number: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    capacity: { type: DataTypes.INTEGER, allowNull: false },
    book_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
    deposit: { type: DataTypes.INTEGER, defaultValue: 0 },
    cancel_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
    location: { type: DataTypes.STRING(50), allowNull: true },
    status: { type: DataTypes.ENUM('available','occupied','cleaning','reserved'), defaultValue: 'available' },
    panorama_urls: { type: DataTypes.JSON, allowNull: true },
    amenities: { type: DataTypes.JSON, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    tableName: 'tables',
    timestamps: false
  });
}
