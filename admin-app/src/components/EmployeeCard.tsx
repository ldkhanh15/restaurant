import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Card, 
  Text, 
  Avatar, 
  Badge, 
  useTheme,
  IconButton,
  Chip 
} from 'react-native-paper';
import { Employee } from '@/api/employeeApi';
import { formatCurrency } from '@/utils';
import { 
  getEmployeeFullName,
  getEmployeeEmail,
  getEmployeePhone,
  getEmployeePosition,
  getEmployeeDepartment,
  getEmployeeSalary,
  getEmployeeStatus,
  getEmployeeAvatar,
  getDepartmentColor
} from '@/utils/employeeUtils';
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
  
  // Get employee data using helper functions
  const fullName = getEmployeeFullName(employee);
  const email = getEmployeeEmail(employee);
  const phone = getEmployeePhone(employee);
  const position = getEmployeePosition(employee);
  const department = getEmployeeDepartment(employee);
  const salary = getEmployeeSalary(employee);
  const status = getEmployeeStatus(employee);
  const avatar = getEmployeeAvatar(employee);
  const departmentColor = getDepartmentColor(department);

  const getStatusBadge = () => {
    switch (status) {
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
            {status}
          </Badge>
        );
    }
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="outlined">
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            {/* Avatar with department indicator */}
            <View style={styles.avatarContainer}>
              {avatar.type === 'url' ? (
                <Avatar.Image
                  size={56}
                  source={{ uri: avatar.value }}
                  style={styles.avatar}
                />
              ) : (
                <Avatar.Text
                  size={56}
                  label={avatar.value}
                  style={[styles.avatar, { backgroundColor: departmentColor }]}
                  color="#fff"
                />
              )}
            </View>

            {/* Main Info */}
            <View style={styles.mainInfo}>
              <View style={styles.nameSection}>
                <Text 
                  variant="titleMedium" 
                  style={[styles.name, { color: theme.colors.onSurface }]}
                >
                  {fullName}
                </Text>
                <Text 
                  variant="bodyMedium" 
                  style={[styles.position, { color: theme.colors.primary }]}
                >
                  {position}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Chip
                  mode="flat"
                  compact
                  style={[styles.departmentChip, { backgroundColor: departmentColor + '20' }]}
                  textStyle={{ fontSize: 11, color: departmentColor }}
                >
                  {department}
                </Chip>
              </View>

              <View style={styles.statusRow}>
                {getStatusBadge()}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              {onView && (
                <IconButton
                  icon="eye"
                  size={20}
                  onPress={onView}
                  iconColor={theme.colors.primary}
                  style={styles.actionButton}
                />
              )}
              {onEdit && (
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={onEdit}
                  iconColor={theme.colors.primary}
                  style={styles.actionButton}
                />
              )}
            </View>
          </View>

          {/* Contact & Salary Footer */}
          <View style={styles.footer}>
            <View style={styles.contactSection}>
              <View style={styles.contactRow}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginRight: 4 }}>
                  📧
                </Text>
                <Text 
                  variant="bodySmall" 
                  style={[styles.contactText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {email || 'N/A'}
                </Text>
              </View>
              <View style={styles.contactRow}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginRight: 4 }}>
                  📱
                </Text>
                <Text 
                  variant="bodySmall" 
                  style={[styles.contactText, { color: theme.colors.onSurfaceVariant }]}
                >
                  {phone || 'N/A'}
                </Text>
              </View>
            </View>

            {salary > 0 && (
              <View style={[styles.salaryContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text 
                  variant="labelSmall" 
                  style={[styles.salaryLabel, { color: theme.colors.onPrimaryContainer }]}
                >
                  Lương cơ bản
                </Text>
                <Text 
                  variant="titleSmall" 
                  style={[styles.salaryValue, { color: theme.colors.onPrimaryContainer }]}
                >
                  {formatCurrency(salary)}
                </Text>
              </View>
            )}
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
    marginRight: spacing.md,
  },
  avatar: {
    // No need for backgroundColor, will use department color
  },
  mainInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  nameSection: {
    marginBottom: spacing.xs,
  },
  name: {
    fontWeight: '600',
    marginBottom: 4,
  },
  position: {
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  departmentChip: {
    height: 24,
    marginRight: spacing.xs,
  },
  separator: {
    marginHorizontal: spacing.xs,
    fontSize: 12,
  },
  experience: {
    fontSize: 12,
  },
  statusRow: {
    marginTop: spacing.xs,
  },
  badge: {
    fontSize: 10,
    paddingHorizontal: spacing.xs,
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  actionButton: {
    margin: 0,
  },
  footer: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  contactSection: {
    marginBottom: spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    flex: 1,
  },
  salaryContainer: {
    padding: spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salaryLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  salaryValue: {
    fontWeight: '700',
    fontSize: 14,
  },
});