import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  Badge, 
  useTheme,
  IconButton 
} from 'react-native-paper';
import { Employee } from '@/api/employees';
import { formatCurrency } from '@/utils';
import { spacing } from '@/theme';

interface EmployeeCardProps {
  employee: Employee;
  onPress?: () => void;
  onEdit?: () => void;
  onView?: () => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onPress,
  onEdit,
  onView,
}) => {
  const theme = useTheme();

  const getStatusBadge = () => {
    switch (employee.status) {
      case 'active':
        return (
          <Badge 
            style={[styles.badge, { backgroundColor: '#e8f5e8', color: '#2e7d32' }]}
            size={20}
          >
            Đang làm việc
          </Badge>
        );
      case 'inactive':
        return (
          <Badge 
            style={[styles.badge, { backgroundColor: '#fff3cd', color: '#856404' }]}
            size={20}
          >
            Tạm nghỉ
          </Badge>
        );
      case 'terminated':
        return (
          <Badge 
            style={[styles.badge, { backgroundColor: '#f8d7da', color: '#721c24' }]}
            size={20}
          >
            Đã nghỉ việc
          </Badge>
        );
      default:
        return (
          <Badge 
            style={[styles.badge, { backgroundColor: theme.colors.surfaceVariant }]}
            size={20}
          >
            {employee.status}
          </Badge>
        );
    }
  };

  const getDepartmentColor = () => {
    switch (employee.department) {
      case 'Bếp':
        return '#ff6b35';
      case 'Phục vụ':
        return '#4dabf7';
      case 'Quản lý':
        return '#69db7c';
      default:
        return theme.colors.primary;
    }
  };

  const formatHireDate = () => {
    const hireDate = new Date(employee.hire_date);
    const now = new Date();
    const diffMonths = (now.getFullYear() - hireDate.getFullYear()) * 12 + 
                      (now.getMonth() - hireDate.getMonth());
    
    if (diffMonths < 1) {
      return 'Mới tuyển';
    } else if (diffMonths < 12) {
      return `${diffMonths} tháng`;
    } else {
      const years = Math.floor(diffMonths / 12);
      const months = diffMonths % 12;
      return `${years} năm${months > 0 ? ` ${months} tháng` : ''}`;
    }
  };

  const getAvatarLabel = () => {
    const names = employee.full_name.split(' ');
    if (names.length >= 2) {
      return names[names.length - 2].charAt(0) + names[names.length - 1].charAt(0);
    }
    return employee.full_name.charAt(0);
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="outlined">
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Avatar.Image
                size={56}
                source={{ uri: employee.face_image_url || 'https://via.placeholder.com/56' }}
                style={styles.avatar}
              />
              <View 
                style={[
                  styles.departmentIndicator, 
                  { backgroundColor: getDepartmentColor() }
                ]}
              />
            </View>

            <View style={styles.mainInfo}>
              <View style={styles.nameRow}>
                <Text 
                  variant="titleMedium" 
                  style={[styles.name, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                >
                  {employee.full_name}
                </Text>
                {getStatusBadge()}
              </View>

              <Text 
                variant="bodyMedium" 
                style={[styles.position, { color: theme.colors.primary }]}
                numberOfLines={1}
              >
                {employee.position}
              </Text>

              <View style={styles.infoRow}>
                <Text 
                  variant="bodySmall" 
                  style={[styles.department, { color: theme.colors.onSurfaceVariant }]}
                >
                  {employee.department}
                </Text>
                <Text 
                  variant="bodySmall" 
                  style={[styles.separator, { color: theme.colors.onSurfaceVariant }]}
                >
                  •
                </Text>
                <Text 
                  variant="bodySmall" 
                  style={[styles.experience, { color: theme.colors.onSurfaceVariant }]}
                >
                  {formatHireDate()}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              {onView && (
                <IconButton
                  icon="eye"
                  size={20}
                  onPress={onView}
                  style={styles.actionButton}
                />
              )}
              {onEdit && (
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={onEdit}
                  style={styles.actionButton}
                />
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.contactInfo}>
              <Text 
                variant="bodySmall" 
                style={[styles.email, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {employee.email}
              </Text>
              <Text 
                variant="bodySmall" 
                style={[styles.phone, { color: theme.colors.onSurfaceVariant }]}
              >
                {employee.phone}
              </Text>
            </View>

            <View style={styles.salaryContainer}>
              <Text 
                variant="labelSmall" 
                style={[styles.salaryLabel, { color: theme.colors.onSurfaceVariant }]}
              >
                Lương cơ bản
              </Text>
              <Text 
                variant="titleSmall" 
                style={[styles.salary, { color: theme.colors.primary }]}
              >
                {formatCurrency(employee.salary)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    elevation: 2,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    backgroundColor: '#f0f0f0',
  },
  departmentIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  mainInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  name: {
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    fontSize: 10,
    paddingHorizontal: spacing.xs,
  },
  position: {
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  department: {
    fontSize: 12,
  },
  separator: {
    marginHorizontal: spacing.xs,
    fontSize: 12,
  },
  experience: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionButton: {
    margin: 0,
    marginLeft: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  contactInfo: {
    flex: 1,
  },
  email: {
    fontSize: 12,
    marginBottom: 2,
  },
  phone: {
    fontSize: 12,
  },
  salaryContainer: {
    alignItems: 'flex-end',
  },
  salaryLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  salary: {
    fontWeight: '600',
  },
});