# 6. Notifications and User Feedback

> How to use Ant Design notifications for user feedback

[← Back: State Management](./05-STATE-MANAGEMENT.md) | [Index](./README.md)

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Fundamental Rule](#-fundamental-rule)
3. [Notification Types](#-notification-types)
4. [Message API (Simple Toasts)](#-message-api-simple-toasts)
5. [Notification API (Rich Notifications)](#-notification-api-rich-notifications)
6. [useNotification Hook](#-usenotification-hook)
7. [API Error Handling](#-api-error-handling)
8. [Modal Confirmations](#-modal-confirmations)
9. [Usage in Layouts and Components](#-usage-in-layouts-and-components)
10. [Best Practices](#-best-practices)
11. [Complete Examples](#-complete-examples)

---

## 🎯 Overview

We use **Ant Design's message and notification APIs** for ALL user feedback in the application.

### Types of Feedback

- ✅ **Message (Toast)** - Simple, temporary notifications
- ✅ **Notification** - Rich notifications with actions
- ✅ **Modal** - Confirmations for important actions

### Ant Design APIs

```javascript
import { message, notification, Modal } from "antd";

// Simple toast
message.success("User created successfully!");

// Rich notification
notification.success({
  message: "Success",
  description: "User created successfully!",
});

// Confirmation modal
Modal.confirm({
  title: "Delete user?",
  content: "This action cannot be undone.",
  onOk: () => handleDelete(),
});
```

---

## 🔴 Fundamental Rule

> **IMPORTANT:** Notifications are configured in **COMPONENT or LAYOUT**, NEVER in **HOOK**

```
┌─────────────────────────────────────────────────────┐
│                    HOOK                             │
│  - Manages data                                     │
│  - Returns: isSuccess, isError                      │
│  ❌ Does NOT show notifications                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│              LAYOUT/COMPONENT                       │
│  - Uses hook                                        │
│  - Checks isSuccess/isError                         │
│  ✅ SHOWS notifications here                        │
└─────────────────────────────────────────────────────┘
```

### Why?

- **Separation of responsibilities**: Hook = data, Component = UI/feedback
- **Reusability**: Same hook can have different feedback in different contexts
- **Testability**: Hook testable without UI side effects

---

## 📊 Notification Types

### 1. ✅ Success

**When to use:**

- Action completed successfully
- Form submitted
- Data saved

**Configuration:**

- Icon: ✅ success (green checkmark)
- Color: Green
- Duration: 3 seconds
- Auto-close: Yes

### 2. ❌ Error

**When to use:**

- Request failed
- Validation error
- Operation not allowed

**Configuration:**

- Icon: ❌ error (red X)
- Color: Red
- Duration: 4 seconds
- Auto-close: Yes

### 3. ⚠️ Warning

**When to use:**

- Form validation
- Missing required fields
- Confirmation needed

**Configuration:**

- Icon: ⚠️ warning (yellow triangle)
- Color: Yellow
- Duration: 3 seconds
- Auto-close: Yes

### 4. ℹ️ Info

**When to use:**

- General information
- Tips for user
- Guidance

**Configuration:**

- Icon: ℹ️ info (blue circle)
- Color: Blue
- Duration: 3 seconds
- Auto-close: Yes

---

## 💬 Message API (Simple Toasts)

> For simple, temporary notifications

### Basic Usage

```typescript
import { message } from "antd";

// Success
message.success("Operation completed successfully!");

// Error
message.error("An error occurred");

// Warning
message.warning("Please fill all required fields");

// Info
message.info("Remember to save your changes");

// Loading
message.loading("Processing...");
```

### With Duration

```typescript
// Custom duration (in seconds)
message.success("User created!", 5); // 5 seconds

// Manual close
const hide = message.loading("Loading...", 0); // 0 = no auto-close
setTimeout(hide, 2000); // Close after 2 seconds
```

### Advanced Options

```typescript
message.success({
  content: "User created successfully!",
  duration: 3,
  onClose: () => {
    console.log("Message closed");
  },
});
```

### Promise-based Loading

```typescript
const saveData = async () => {
  message.loading("Saving...");
  
  try {
    await createUser(userData);
    message.destroy(); // Remove loading
    message.success("User created!");
  } catch (error) {
    message.destroy();
    message.error("Error creating user");
  }
};
```

---

## 🔔 Notification API (Rich Notifications)

> For rich notifications with title, description, and actions

### Basic Usage

```typescript
import { notification } from "antd";

// Success
notification.success({
  message: "Success",
  description: "User created successfully!",
});

// Error
notification.error({
  message: "Error",
  description: "Failed to create user",
});

// Warning
notification.warning({
  message: "Warning",
  description: "Some fields are missing",
});

// Info
notification.info({
  message: "Info",
  description: "New features available",
});
```

### With Duration and Placement

```typescript
notification.success({
  message: "User Created",
  description: "The user has been created successfully.",
  duration: 4.5,
  placement: "topRight", // topLeft, topRight, bottomLeft, bottomRight
});
```

### With Actions

```typescript
notification.success({
  message: "User Created",
  description: "John Doe has been added to the system.",
  btn: (
    <Button type="primary" size="small" onClick={() => console.log("View")}>
      View User
    </Button>
  ),
  onClose: () => {
    console.log("Notification closed");
  },
});
```

### With Icon

```typescript
import { SmileOutlined } from "@ant-design/icons";

notification.open({
  message: "Welcome!",
  description: "Thanks for joining us!",
  icon: <SmileOutlined style={{ color: "#108ee9" }} />,
});
```

---

## 🪝 useNotification Hook

Create a custom hook to centralize notification logic:

### Hook Implementation

```typescript
// globals/hooks/useNotification.ts

import { message, notification } from "antd";
import type { NotificationPlacement } from "antd/es/notification/interface";

export function useNotification() {
  /**
   * Show simple success message
   */
  const showSuccess = (content: string, duration = 3) => {
    message.success(content, duration);
  };

  /**
   * Show simple error message
   */
  const showError = (content: string, duration = 4) => {
    message.error(content, duration);
  };

  /**
   * Show simple warning message
   */
  const showWarning = (content: string, duration = 3) => {
    message.warning(content, duration);
  };

  /**
   * Show simple info message
   */
  const showInfo = (content: string, duration = 3) => {
    message.info(content, duration);
  };

  /**
   * Show rich notification
   */
  const showNotification = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    description?: string,
    placement: NotificationPlacement = "topRight"
  ) => {
    notification[type]({
      message: title,
      description,
      placement,
    });
  };

  /**
   * Show API error with formatted message
   */
  const showApiError = (error: any, defaultMessage = "An error occurred") => {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      defaultMessage;

    message.error(errorMessage, 4);
  };

  /**
   * Show loading message
   */
  const showLoading = (content: string) => {
    return message.loading(content, 0); // Returns hide function
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification,
    showApiError,
    showLoading,
  };
}
```

### Hook Usage

```typescript
import { useNotification } from "@/globals/hooks/useNotification";

export default function CreateUserForm() {
  const { showSuccess, showError, showApiError } = useNotification();
  const { createUser, isLoading, isSuccess, isError, error } = useCreateUser();

  const handleSubmit = (values) => {
    createUser(values);
  };

  // Show success notification
  useEffect(() => {
    if (isSuccess) {
      showSuccess("User created successfully!");
    }
  }, [isSuccess]);

  // Show error notification
  useEffect(() => {
    if (isError) {
      showApiError(error);
    }
  }, [isError]);

  return <Form onFinish={handleSubmit}>{/* Form fields */}</Form>;
}
```

---

## 🚨 API Error Handling

### Automatic Error Formatting

```typescript
/**
 * Show API error with automatic formatting
 */
const showApiError = (error: any, defaultMessage = "An error occurred") => {
  // Extract error message from different sources
  const errorMessage =
    error?.response?.data?.message || // Backend error message
    error?.response?.data?.error || // Alternative backend format
    error?.message || // JavaScript error message
    defaultMessage; // Fallback message

  // Extract status code if available
  const status = error?.response?.status;

  // Different messages based on status
  if (status === 401) {
    message.error("Unauthorized. Please login again.");
  } else if (status === 403) {
    message.error("You don't have permission for this action.");
  } else if (status === 404) {
    message.error("Resource not found.");
  } else if (status === 500) {
    message.error("Server error. Please try again later.");
  } else {
    message.error(errorMessage, 4);
  }
};
```

### Usage in Components

```typescript
import { useNotification } from "@/globals/hooks/useNotification";

export default function UserForm() {
  const { showApiError } = useNotification();
  const { createUser, isError, error } = useCreateUser();

  useEffect(() => {
    if (isError) {
      // Automatically formats and shows error
      showApiError(error);
    }
  }, [isError]);

  // ...
}
```

---

## 🔔 Modal Confirmations

### Using Ant Design Modal.confirm

```typescript
import { Modal } from "antd";

const handleDelete = (userId: string) => {
  Modal.confirm({
    title: "Delete User",
    content: "Are you sure you want to delete this user? This action cannot be undone.",
    okText: "Yes, delete",
    cancelText: "Cancel",
    okType: "danger",
    onOk: async () => {
      await deleteUser(userId);
      message.success("User deleted successfully");
    },
  });
};
```

### With Async Operation

```typescript
const handleDelete = (userId: string) => {
  Modal.confirm({
    title: "Delete User",
    content: "Are you sure?",
    okText: "Delete",
    okType: "danger",
    onOk: async () => {
      try {
        await deleteUser(userId);
        message.success("User deleted!");
        return Promise.resolve();
      } catch (error) {
        message.error("Error deleting user");
        return Promise.reject();
      }
    },
  });
};
```

### Custom Modal with State

```typescript
export default function UserCard({ id, name }) {
  const [modalOpen, setModalOpen] = useState(false);
  const { deleteUser, isLoadingDelete } = useManageUser();

  const handleConfirmDelete = async () => {
    await deleteUser(id);
    setModalOpen(false);
    message.success("User deleted successfully!");
  };

  return (
    <>
      <Button danger onClick={() => setModalOpen(true)}>
        Delete
      </Button>

      <Modal
        open={modalOpen}
        title="Delete User"
        onCancel={() => setModalOpen(false)}
        onOk={handleConfirmDelete}
        confirmLoading={isLoadingDelete}
        okText="Delete"
        okType="danger"
      >
        <p>Are you sure you want to delete {name}?</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </>
  );
}
```

---

## 🎨 Usage in Layouts and Components

### In Layouts

```typescript
export default function UserListLayout() {
  const { showSuccess, showApiError } = useNotification();
  const { users, isLoading, isError, error } = useUsers();
  const { followUser, isSuccessFollow, isErrorFollow, errorFollow } =
    useFollowUser();

  // Show success after following
  useEffect(() => {
    if (isSuccessFollow) {
      showSuccess("User followed successfully!");
    }
  }, [isSuccessFollow]);

  // Show error if follow fails
  useEffect(() => {
    if (isErrorFollow) {
      showApiError(errorFollow);
    }
  }, [isErrorFollow]);

  const handleFollow = (userId: string) => {
    followUser(userId);
  };

  if (isLoading) return <Skeleton />;
  if (isError) return <ErrorContent error={error} />;

  return (
    <div>
      {users.map((user) => (
        <UserCard key={user.id} {...user} onFollow={() => handleFollow(user.id)} />
      ))}
    </div>
  );
}
```

### In Forms

```typescript
export default function CreateUserForm() {
  const [form] = Form.useForm();
  const { showSuccess, showApiError } = useNotification();
  const { createUser, isLoading, isSuccess, isError, error } = useCreateUser();

  const handleSubmit = (values) => {
    createUser(values);
  };

  // Success notification
  useEffect(() => {
    if (isSuccess) {
      showSuccess("User created successfully!");
      form.resetFields();
    }
  }, [isSuccess]);

  // Error notification
  useEffect(() => {
    if (isError) {
      showApiError(error);
    }
  }, [isError]);

  return (
    <Form form={form} onFinish={handleSubmit}>
      <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
        <Input />
      </Form.Item>

      <Button type="primary" htmlType="submit" loading={isLoading}>
        Create User
      </Button>
    </Form>
  );
}
```

### With Multiple Operations

```typescript
export default function UserManagement() {
  const { showSuccess, showError, showApiError } = useNotification();
  const {
    createUser,
    updateUser,
    deleteUser,
    isSuccessCreate,
    isSuccessUpdate,
    isSuccessDelete,
    isErrorCreate,
    isErrorUpdate,
    isErrorDelete,
    errorCreate,
    errorUpdate,
    errorDelete,
  } = useManageUser();

  // Success notifications
  useEffect(() => {
    if (isSuccessCreate) showSuccess("User created!");
  }, [isSuccessCreate]);

  useEffect(() => {
    if (isSuccessUpdate) showSuccess("User updated!");
  }, [isSuccessUpdate]);

  useEffect(() => {
    if (isSuccessDelete) showSuccess("User deleted!");
  }, [isSuccessDelete]);

  // Error notifications
  useEffect(() => {
    if (isErrorCreate) showApiError(errorCreate);
  }, [isErrorCreate]);

  useEffect(() => {
    if (isErrorUpdate) showApiError(errorUpdate);
  }, [isErrorUpdate]);

  useEffect(() => {
    if (isErrorDelete) showApiError(errorDelete);
  }, [isErrorDelete]);

  // ...
}
```

---

## ✅ Best Practices

### 1. Always in Components/Layouts, Never in Hooks

```typescript
// ✅ GOOD - In component
export default function CreateUser() {
  const { showSuccess } = useNotification();
  const { createUser, isSuccess } = useCreateUser();

  useEffect(() => {
    if (isSuccess) {
      showSuccess("User created!");
    }
  }, [isSuccess]);
}

// ❌ BAD - In hook
export function useCreateUser() {
  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      message.success("User created!"); // ❌ Don't do this in hook!
    },
  });
}
```

### 2. Use showApiError for API Errors

```typescript
// ✅ GOOD - Automatic formatting
const { showApiError } = useNotification();

useEffect(() => {
  if (isError) {
    showApiError(error); // Formats automatically
  }
}, [isError]);

// ❌ BAD - Manual formatting
useEffect(() => {
  if (isError) {
    message.error(error?.message || "Error"); // Repetitive
  }
}, [isError]);
```

### 3. Specific Messages

```typescript
// ✅ GOOD - Specific and helpful
message.success("User John Doe created successfully!");
message.error("Email already exists. Please use a different email.");
message.warning("Please fill in all required fields before submitting.");

// ❌ BAD - Generic and unhelpful
message.success("Success");
message.error("Error");
message.warning("Warning");
```

### 4. Appropriate Durations

```typescript
// ✅ GOOD - Appropriate durations
message.success("Saved!", 2); // Quick confirmation
message.error("Connection failed", 5); // Error needs more time to read
message.info("Remember to save your changes", 4); // Important info

// ❌ BAD - All same duration
message.success("Saved!", 10); // Too long
message.error("Error", 1); // Too short
```

### 5. Use Modal.confirm for Destructive Actions

```typescript
// ✅ GOOD - Confirmation before delete
const handleDelete = () => {
  Modal.confirm({
    title: "Delete User",
    content: "This action cannot be undone.",
    okType: "danger",
    onOk: async () => {
      await deleteUser(id);
    },
  });
};

// ❌ BAD - Delete without confirmation
const handleDelete = async () => {
  await deleteUser(id); // No confirmation!
};
```

---

## 💡 Complete Examples

### Example 1: CRUD Operations

```typescript
export default function UserManagement() {
  const { showSuccess, showApiError } = useNotification();
  const {
    createUser,
    updateUser,
    deleteUser,
    isSuccessCreate,
    isSuccessUpdate,
    isSuccessDelete,
    isErrorCreate,
    isErrorUpdate,
    isErrorDelete,
    errorCreate,
    errorUpdate,
    errorDelete,
  } = useManageUser();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Create success
  useEffect(() => {
    if (isSuccessCreate) {
      showSuccess("User created successfully!");
      setModalOpen(false);
    }
  }, [isSuccessCreate]);

  // Update success
  useEffect(() => {
    if (isSuccessUpdate) {
      showSuccess("User updated successfully!");
      setModalOpen(false);
      setEditingUser(null);
    }
  }, [isSuccessUpdate]);

  // Delete success
  useEffect(() => {
    if (isSuccessDelete) {
      showSuccess("User deleted successfully!");
    }
  }, [isSuccessDelete]);

  // Errors
  useEffect(() => {
    if (isErrorCreate) showApiError(errorCreate);
  }, [isErrorCreate]);

  useEffect(() => {
    if (isErrorUpdate) showApiError(errorUpdate);
  }, [isErrorUpdate]);

  useEffect(() => {
    if (isErrorDelete) showApiError(errorDelete);
  }, [isErrorDelete]);

  const handleDelete = (user) => {
    Modal.confirm({
      title: "Delete User",
      content: `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        deleteUser(user.id);
      },
    });
  };

  return (
    <div>
      <Button type="primary" onClick={() => setModalOpen(true)}>
        Create User
      </Button>

      {/* User list with actions */}
    </div>
  );
}
```

### Example 2: File Upload

```typescript
export default function FileUpload() {
  const { showSuccess, showError, showLoading } = useNotification();
  const { uploadFile, isLoading, isSuccess, isError } = useFileUpload();

  const handleUpload = async (file) => {
    const hide = showLoading("Uploading file...");

    try {
      await uploadFile(file);
      hide();
      showSuccess("File uploaded successfully!");
    } catch (error) {
      hide();
      showError("Error uploading file");
    }
  };

  return (
    <Upload customRequest={({ file }) => handleUpload(file)}>
      <Button icon={<UploadOutlined />}>Upload</Button>
    </Upload>
  );
}
```

### Example 3: Form with Validation

```typescript
export default function UserForm() {
  const [form] = Form.useForm();
  const { showSuccess, showWarning, showApiError } = useNotification();
  const { createUser, isLoading, isSuccess, isError, error } = useCreateUser();

  const handleSubmit = (values) => {
    createUser(values);
  };

  const handleValidationFailed = () => {
    showWarning("Please fill in all required fields");
  };

  useEffect(() => {
    if (isSuccess) {
      showSuccess("User created successfully!");
      form.resetFields();
    }
  }, [isSuccess]);

  useEffect(() => {
    if (isError) {
      showApiError(error);
    }
  }, [isError]);

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      onFinishFailed={handleValidationFailed}
    >
      {/* Form fields */}
      
      <Button type="primary" htmlType="submit" loading={isLoading}>
        Create User
      </Button>
    </Form>
  );
}
```

---

## 📋 Checklist

### Before Showing Notifications

- [ ] Is it in a component/layout (not in hook)?
- [ ] Using `useNotification` hook?
- [ ] Message is specific and helpful?
- [ ] Appropriate duration for message type?
- [ ] Using `showApiError` for API errors?
- [ ] Modal.confirm for destructive actions?

### Message Types

- [ ] Success for completed actions?
- [ ] Error for failures?
- [ ] Warning for validation/missing data?
- [ ] Info for helpful tips?

---

## 🎓 Summary

### Golden Rule

**Notifications in COMPONENTS/LAYOUTS, NEVER in HOOKS**

### Notification APIs

```typescript
// Simple toast
import { message } from "antd";
message.success("Success!");

// Rich notification
import { notification } from "antd";
notification.success({
  message: "Success",
  description: "Operation completed",
});

// Confirmation
import { Modal } from "antd";
Modal.confirm({
  title: "Confirm",
  onOk: () => handleAction(),
});
```

### useNotification Hook

```typescript
const {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showApiError,
  showLoading,
} = useNotification();
```

---

## 📚 Next Steps

→ Review [**State Management**](./05-STATE-MANAGEMENT.md) for React Query patterns  
---

[← Back: State Management](./05-STATE-MANAGEMENT.md) | [Index](./README.md)

