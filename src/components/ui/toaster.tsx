"use client"

import * as React from "react"
import { Toaster as SonnerToaster } from "sonner"

function Toaster() {
  return (
    <SonnerToaster
      theme="light"
      toastOptions={{
        style: {
          background: "#ffffff",
          border: "1px solid #e5edf5",
          color: "#061b31",
          boxShadow: "rgba(50,50,93,0.16) 0px 18px 30px -20px, rgba(0,0,0,0.08) 0px 12px 22px -16px"
        },
        classNames: {
          success: "border-[#15be53]",
          error: "border-rose-300",
          warning: "border-amber-300"
        }
      }}
    />
  )
}

export { Toaster }
