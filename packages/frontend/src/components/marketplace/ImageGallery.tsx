import React, { useState } from 'react';
import { Image, Card, Row, Col, Modal, Button } from 'antd';
import { EyeOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';

const { Meta } = Card;

interface ImageGalleryProps {
  images?: string[];
  title?: string;
  loading?: boolean;
  showPreview?: boolean;
  gridCols?: number;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images = [],
  title = 'Gallery',
  loading = false,
  showPreview = true,
  gridCols = 3,
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const handlePreview = (index: number) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const handlePrev = () => {
    setPreviewIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setPreviewIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'Escape') {
      setPreviewVisible(false);
    }
  };

  const getGridSpan = () => {
    switch (gridCols) {
      case 1:
        return { xs: 24, sm: 24, md: 24, lg: 24, xl: 24 };
      case 2:
        return { xs: 24, sm: 12, md: 12, lg: 12, xl: 12 };
      case 3:
        return { xs: 24, sm: 12, md: 8, lg: 8, xl: 8 };
      case 4:
        return { xs: 12, sm: 8, md: 6, lg: 6, xl: 6 };
      default:
        return { xs: 24, sm: 12, md: 8, lg: 8, xl: 8 };
    }
  };

  const gridSpan = getGridSpan();

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{title}</span>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {images.length} {images.length === 1 ? 'image' : 'images'}
          </span>
        </div>
      }
      style={{ marginBottom: '24px' }}
      bodyStyle={{ padding: '16px' }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading images...
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {images.map((image, index) => (
              <Col key={index} {...gridSpan}>
                <div
                  style={{
                    position: 'relative',
                    paddingTop: '75%', // 4:3 aspect ratio
                    overflow: 'hidden',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: '#f5f5f5',
                  }}
                  onClick={() => showPreview && handlePreview(index)}
                >
                  <img
                    src={image}
                    alt={`Gallery image ${index + 1}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                  
                  {showPreview && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                      }}
                      className="gallery-overlay"
                    >
                      <EyeOutlined />
                      <span>Preview</span>
                    </div>
                  )}
                </div>
              </Col>
            ))}
          </Row>

          {/* Preview Modal */}
          <Modal
            open={previewVisible}
            onCancel={() => setPreviewVisible(false)}
            footer={null}
            width="90%"
            style={{ maxWidth: '1200px' }}
            bodyStyle={{ padding: 0 }}
            centered
            destroyOnClose
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000',
                minHeight: '500px',
              }}
              onKeyDown={handleKeyDown}
              tabIndex={0}
            >
              {/* Navigation Buttons */}
              {images.length > 1 && (
                <>
                  <Button
                    type="text"
                    icon={<LeftOutlined />}
                    onClick={handlePrev}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: 'none',
                      fontSize: '18px',
                      width: '48px',
                      height: '48px',
                    }}
                  />
                  <Button
                    type="text"
                    icon={<RightOutlined />}
                    onClick={handleNext}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: 'none',
                      fontSize: '18px',
                      width: '48px',
                      height: '48px',
                    }}
                  />
                </>
              )}

              {/* Main Image */}
              <img
                src={images[previewIndex]}
                alt={`Preview image ${previewIndex + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                }}
              />

              {/* Image Counter */}
              {images.length > 1 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                  }}
                >
                  {previewIndex + 1} / {images.length}
                </div>
              )}
            </div>
          </Modal>
        </>
      )}
    </Card>
  );
};

export default ImageGallery;