
import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FileText } from 'lucide-react'; // top-right icon for multiple slips

const SalarySlipCard = ({ data, onClose }) => {
  const slipRefs = useRef([]);

  // Check if data is array or single object
  const dataArray = Array.isArray(data) ? data : [data];

  const downloadPDF = async (index) => {
    const input = slipRefs.current[index];
    if (!input) return;

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const employeeId = dataArray[index].employeeId?._id || 'unknown';
    pdf.save(`Salary_Slip_${employeeId}.pdf`);

    // Close only if single data
    if (!Array.isArray(data)) onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '10px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '8px',
          width: '750px',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '20px',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          &times;
        </button>

        {/* Map over salary data */}
        {dataArray.map((item, index) => {
          const netPay = (item.basic || 0) + (item.allowance || 0) - (item.deductions || 0);

          return (
            <div
              key={item._id || index}
              ref={(el) => (slipRefs.current[index] = el)}
              style={{
                position: 'relative',
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                marginBottom: '20px',
              }}
            >
              {/* Top-right icon for multiple cards */}
              {dataArray.length > 1 && (
                <FileText
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    fontSize: '20px',
                    color: '#2c3e50',
                  }}
                />
              )}

              <h2 style={{ textAlign: 'center', color: '#2c3e50' }}>Infonic Solution Private Limited</h2>
              <p style={{ textAlign: 'center', marginBottom: '10px' }}>
                Salary Slip - {item.month} {item.year}
              </p>
              <hr />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '10px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <p>
                  <strong>Name:</strong> {item.employeeId?.fullName || 'N/A'}
                </p>
                <p>
                  <strong>Employee ID:</strong> EMP{item.employeeId?._id?.slice(-6).toUpperCase() || 'N/A'}
                </p>
                <p>
                  <strong>Department:</strong> {item.departmentId?.name || 'N/A'}
                </p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f2f2f2' }}>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Earnings</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Amount (₹)</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Deductions</th>
                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>Basic Salary</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.basic || 0}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>Deductions</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.deductions || 0}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>Allowance</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.allowance || 0}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>-</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>-</td>
                  </tr>
                </tbody>
              </table>

              <h3 style={{ marginTop: '20px', textAlign: 'right' }}>Net Pay: ₹{netPay}</h3>

              {/* Download Button */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <button
                  onClick={() => downloadPDF(index)}
                  style={{
                    padding: '10px 20px',
                    background: '#2c3e50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Download PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalarySlipCard;

