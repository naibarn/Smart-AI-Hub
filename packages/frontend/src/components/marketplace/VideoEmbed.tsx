import React, { useState } from 'react';
import { Card, Button, Modal } from 'antd';
import { PlayCircleOutlined, YoutubeOutlined } from '@ant-design/icons';

interface VideoEmbedProps {
  videoUrl?: string;
  title?: string;
  thumbnailUrl?: string;
  loading?: boolean;
  autoplay?: boolean;
  width?: string | number;
  height?: string | number;
}

const VideoEmbed: React.FC<VideoEmbedProps> = ({
  videoUrl,
  title = 'Video',
  thumbnailUrl,
  loading = false,
  autoplay = false,
  width = '100%',
  height = 400,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  if (!videoUrl) {
    return null;
  }

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  // Generate YouTube embed URL
  const getYouTubeEmbedUrl = (url: string, autoplay: boolean = false): string => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return url;

    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      autoplay: autoplay ? '1' : '0',
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  // Generate YouTube thumbnail URL
  const getYouTubeThumbnailUrl = (url: string): string => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return '';

    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const videoId = getYouTubeVideoId(videoUrl);
  const embedUrl = getYouTubeEmbedUrl(videoUrl, autoplay);
  const thumbnail = thumbnailUrl || getYouTubeThumbnailUrl(videoUrl);

  const handlePlay = () => {
    if (videoId) {
      setModalVisible(true);
    } else {
      // For non-YouTube videos, open in new tab
      window.open(videoUrl, '_blank');
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  if (loading) {
    return (
      <Card
        title={title}
        style={{ marginBottom: '24px' }}
        bodyStyle={{ padding: '40px', textAlign: 'center' }}
      >
        Loading video...
      </Card>
    );
  }

  return (
    <>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <YoutubeOutlined style={{ color: '#FF0000' }} />
            <span>{title}</span>
          </div>
        }
        style={{ marginBottom: '24px' }}
        bodyStyle={{ padding: 0 }}
      >
        <div
          style={{
            position: 'relative',
            width,
            height,
            backgroundColor: '#000',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
          onClick={handlePlay}
        >
          {/* Video Thumbnail */}
          {thumbnail && (
            <img
              src={thumbnail}
              alt="Video thumbnail"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}

          {/* Play Button Overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              transition: 'backgroundColor 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s ease, backgroundColor 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
              }}
            >
              <PlayCircleOutlined
                style={{
                  fontSize: '36px',
                  color: 'white',
                  marginLeft: '4px', // Center the play icon
                }}
              />
            </div>
          </div>

          {/* YouTube Logo */}
          {videoId && (
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <YoutubeOutlined style={{ fontSize: '14px' }} />
              <span>YouTube</span>
            </div>
          )}
        </div>
      </Card>

      {/* Video Modal */}
      {videoId && (
        <Modal
          open={modalVisible}
          onCancel={handleCloseModal}
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
              paddingBottom: '56.25%', // 16:9 aspect ratio
              height: 0,
              overflow: 'hidden',
            }}
          >
            <iframe
              src={getYouTubeEmbedUrl(videoUrl, true)}
              title={title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Modal>
      )}
    </>
  );
};

export default VideoEmbed;
