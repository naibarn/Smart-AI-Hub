import React from 'react';
import { Card, Button, Space, message } from 'antd';
import { DownloadOutlined, QrcodeOutlined } from '@ant-design/icons';
import { QRCodeCanvas as QRCode } from 'qrcode.react';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  size = 256
}) => {
  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
    if (!canvas) {
      message.error('QR Code not found');
      return;
    }
    
    try {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'smart-ai-hub-invite-qr-code.png';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('QR Code downloaded successfully!');
    } catch (error) {
      message.error('Failed to download QR Code');
      console.error('Download error:', error);
    }
  };

  if (!value) {
    return (
      <Card title={<><QrcodeOutlined /> QR Code</>}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          No data available to generate QR Code
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={<><QrcodeOutlined /> QR Code</>}
      extra={
        <Button 
          icon={<DownloadOutlined />} 
          onClick={downloadQRCode}
          type="primary"
        >
          Download
        </Button>
      }
    >
      <div style={{ textAlign: 'center' }}>
        <QRCode
          id="qr-code"
          value={value}
          size={size}
          level="H"
          includeMargin
          bgColor="#ffffff"
          fgColor="#000000"
        />
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Scan this QR code to join Smart AI Hub
          </p>
        </div>
      </div>
    </Card>
  );
};