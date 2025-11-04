import { Employee } from '@/api/employeeApi';

/**
 * Get employee's full name from either user object or legacy fields
 */
export const getEmployeeFullName = (employee: Employee): string => {
  // Priority 1: user.full_name
  if (employee.user?.full_name) {
    return employee.user.full_name;
  }
  
  // Priority 2: Legacy full_name field
  if (employee.full_name) {
    return employee.full_name;
  }
  
  // Priority 3: Combine first_name + last_name
  if (employee.first_name || employee.last_name) {
    return `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
  }
  
  // Priority 4: Username
  if (employee.user?.username) {
    return employee.user.username;
  }
  
  return 'Unknown';
};

/**
 * Get employee's email
 */
export const getEmployeeEmail = (employee: Employee): string => {
  return employee.user?.email || employee.email || '';
};

/**
 * Get employee's phone
 */
export const getEmployeePhone = (employee: Employee): string => {
  return employee.user?.phone || employee.phone || '';
};

/**
 * Get employee's position
 */
export const getEmployeePosition = (employee: Employee): string => {
  return employee.position || 'N/A';
};

/**
 * Get employee's department (from position or legacy field)
 */
export const getEmployeeDepartment = (employee: Employee): string => {
  // If position contains department info, extract it
  // Otherwise use legacy department field
  return employee.department || extractDepartmentFromPosition(employee.position) || 'N/A';
};

/**
 * Extract department from position string
 * Examples: "Manager - Kitchen" -> "Kitchen", "Chef" -> "Kitchen"
 */
const extractDepartmentFromPosition = (position?: string): string | null => {
  if (!position) return null;
  
  // Check if position contains " - "
  if (position.includes(' - ')) {
    return position.split(' - ')[1].trim();
  }
  
  // Map common positions to departments
  const positionToDepartment: Record<string, string> = {
    'chef': 'Bếp',
    'cook': 'Bếp',
    'kitchen': 'Bếp',
    'waiter': 'Phục vụ',
    'waitress': 'Phục vụ',
    'server': 'Phục vụ',
    'manager': 'Quản lý',
    'supervisor': 'Quản lý',
    'admin': 'Quản lý',
  };
  
  const lowerPosition = position.toLowerCase();
  for (const [key, dept] of Object.entries(positionToDepartment)) {
    if (lowerPosition.includes(key)) {
      return dept;
    }
  }
  
  return null;
};

/**
 * Get employee's salary
 */
export const getEmployeeSalary = (employee: Employee): number => {
  return employee.salary || 0;
};

/**
 * Get employee's status
 */
export const getEmployeeStatus = (employee: Employee): 'active' | 'inactive' | 'terminated' => {
  return employee.status || 'active';
};

/**
 * Get employee's avatar URL or initials
 */
export const getEmployeeAvatar = (employee: Employee): { type: 'url' | 'text'; value: string } => {
  // Check for face_image_url
  if (employee.face_image_url) {
    return { type: 'url', value: employee.face_image_url };
  }
  
  // Generate initials from name
  const fullName = getEmployeeFullName(employee);
  const nameParts = fullName.split(' ').filter(part => part.length > 0);
  
  let initials = '';
  if (nameParts.length === 0) {
    initials = '?';
  } else if (nameParts.length === 1) {
    initials = nameParts[0].charAt(0).toUpperCase();
  } else {
    // First letter of first name + first letter of last name
    initials = nameParts[0].charAt(0).toUpperCase() + 
               nameParts[nameParts.length - 1].charAt(0).toUpperCase();
  }
  
  return { type: 'text', value: initials };
};

/**
 * Get department color for badge/avatar
 */
export const getDepartmentColor = (department: string): string => {
  const colorMap: Record<string, string> = {
    'Bếp': '#ff9800',        // Orange
    'Phục vụ': '#2196f3',    // Blue
    'Quản lý': '#9c27b0',    // Purple
    'Kitchen': '#ff9800',
    'Service': '#2196f3',
    'Management': '#9c27b0',
  };
  
  return colorMap[department] || '#607d8b'; // Default grey
};
