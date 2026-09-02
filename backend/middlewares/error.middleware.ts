import type {Request, Response, NextFunction} from "express";
import env from "../config/env.ts";
import {ZodError} from "zod";

interface CustomError extends Error{
    statusCode?:number,
    keyValue?:any,
    errors?:any,
    code?:number,
};


export const errorHandler = (err:CustomError, req:Request,res:Response, next:NextFunction) => {
   let statusCode = err.statusCode || 500;
   let message = err.message || "Internal Server Error";
  
   if (err instanceof ZodError) {
      statusCode = 400;
      message = "Validation Error";
      
      return res.status(statusCode).json({
          success: false,
          message: message,
          errors: err.issues.map(e => ({
              field: e.path.join("."),
              message: e.message
          })),
          stack: env.NODE_ENV === "production" ? null : err.stack,
      });
   }

  else if(err.name === "CastError"){
    message = `Resource not found. Invalid format.`;
    statusCode = 400;
   }

  else if(err.code === 11000 || (err.keyValue && Object.keys(err.keyValue).length > 0)){
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists. Please use another one.`;
    statusCode = 400;
   }

  else if(err.name === "JsonWebTokenError"){
    message = "Json Web Token is invalid. try again.";
    statusCode = 401;
   }

  else if(err.name === "TokenExpiredError"){
    message = "Json Web Token is expired, try again.";
    statusCode = 401;
   }


   if (env.NODE_ENV !== "production") {
       console.error("🔴 Error Catch Log:", err);
   } else {
       console.error(`🔴 Error: ${message} | Status: ${statusCode}`);
   }

   return res.status(statusCode).json({
    success:false,
    message:message,
    stack: env.NODE_ENV === "production" ? null : err.stack,
   })
}







