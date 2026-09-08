import type { Request, Response, NextFunction } from "express"



export const accessSuperAdminRoleOnly = (req:Request, res:Response, next:NextFunction) => {
     
    try{
        if(req.user?.role !== "super_admin") return res.status(403).json({ success: false, message: "Access Denied: You do not have permission to access this resource."});
        next();
    }
    catch(error:any){
        next(error);
    }
};


export const accessAdminRoleOnly = (req:Request, res:Response, next:NextFunction) => {
     
    try{
        if(req.user?.role !== "admin")  return res.status(403).json({ success: false, message: "Access Denied: You do not have permission to access this resource."});
        next();
    }
    catch(error:any){
        next(error);
    }
};




export const accessEmployeeRoleOnly = (req:Request, res:Response, next:NextFunction) => {
     
    try{
         const userRole = req.user?.role;
          const allowedRoles = ["manager", "employee"];
        if(!userRole || !allowedRoles.includes(userRole)) return res.status(403).json({ success: false, message: "Access Denied: Restricted to staff members only."});

        next();
    }
    catch(error:any){
        next(error);
    }
};




export const accessAdminAndManagerRoleOnly = (req:Request, res:Response, next:NextFunction) => {
  try{
         const userRole = req.user?.role;
          const allowedRoles = ["admin","manager"];
        if(!userRole || !allowedRoles.includes(userRole)) return res.status(403).json({ success: false, message: "Access Denied: Restricted to staff members only."});

        next();
    }
    catch(error:any){
        next(error);
    }
};



export const accessTeamRoleOnly = (req:Request, res:Response, next:NextFunction) => {
  try{
         const userRole = req.user?.role;
          const allowedRoles = ["admin","manager", "employee"];
        if(!userRole || !allowedRoles.includes(userRole)) return res.status(403).json({ success: false, message: "Access Denied: Restricted to staff members only."});

        next();
    }
    catch(error:any){
        next(error);
    }
};



export const accessClientRoleOnly = (req:Request, res:Response, next:NextFunction) => {
  try{
        if(req.user?.role !== "client") return res.status(403).json({ success: false, message: "Access Denied: Restricted to clients only."});

        next();
    }
    catch(error:any){
        next(error);
    }
};
