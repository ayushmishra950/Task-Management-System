import { getIO } from "../config/socketInit.ts";

/**
 * Employee/manager ka status badalne par company ke sabhi connected clients ko batao,
 * taaki task/sub-task forms ki assignee list aur Employees page turant refresh ho jayen.
 * Yahan Notification doc nahi banti — ye sirf live refresh signal hai.
 */
export const emitEmployeeStatusChanged = ({ companyId, employeeId, status, fullName }: { companyId: any; employeeId: any; status: string; fullName?: string }) => {
  try {
    const io = getIO();

    io.to(`company_${companyId?.toString()}`).emit("employee:statusChanged", {
      employeeId: employeeId?.toString(),
      status,
      fullName,
    });

    console.log(`🔄 Employee status changed -> ${fullName ?? employeeId} is now ${status}`);
  } catch (error: any) {
    console.error("emitEmployeeStatusChanged Error:-", error?.message);
  }
};

/**
 * Soft delete hone par us user ki saari sessions revoke kar dete hain,
 * warna already logged-in user chalta rehta.
 */
export const disconnectUserSockets = ({ userId }: { userId: any }) => {
  try {
    const io = getIO();

    io.to(userId?.toString()).disconnectSockets(true);
  } catch (error: any) {
    console.error("disconnectUserSockets Error:-", error?.message);
  }
};
