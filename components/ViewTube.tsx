import React from 'react';

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

interface ViewTubeProps {
  setupData: GameSetup | null;
}

export default function ViewTube({ setupData }: ViewTubeProps) {
  return (
    <div style={{
      fontFamily: 'Roboto, Arial, sans-serif',
      backgroundColor: '#fff',
      color: '#030303',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <header style={{
        height: '56px',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#ff0000',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '16px'
          }}>
            <span style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>▶</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 400, margin: 0 }}>ViewTube</h1>
        </div>
        <div style={{ flex: 1, maxWidth: '600px', margin: '0 32px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search"
              style={{
                width: '100%',
                height: '40px',
                border: '1px solid #ccc',
                borderRadius: '40px',
                padding: '0 48px 0 16px',
                fontSize: '16px',
                outline: 'none'
              }}
            />
            <button style={{
              position: 'absolute',
              right: '8px',
              top: '8px',
              width: '24px',
              height: '24px',
              backgroundColor: '#f8f8f8',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer'
            }}>
              🔍
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#ccc',
            borderRadius: '50%',
            marginRight: '16px'
          }}></div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', padding: '24px', gap: '24px' }}>
        {/* Video and Info */}
        <div style={{ flex: 1 }}>
          {/* Video Player */}
          <div style={{
            width: '100%',
            maxWidth: '100%',
            aspectRatio: '16/9',
            backgroundColor: '#000',
            marginBottom: '16px',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
              title="Rick Astley - Never Gonna Give You Up (Official Music Video)"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 'none' }}
            />
          </div>

          {/* Video Title and Stats */}
          <h1 style={{
            fontSize: '18px',
            fontWeight: 400,
            margin: '0 0 12px 0',
            lineHeight: '24px'
          }}>
            Rick Astley - Never Gonna Give You Up (Official Music Video)
          </h1>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '14px', color: '#606060' }}>
              1,234,567 views • Premiered Oct 25, 2009
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '18px',
                backgroundColor: '#f2f2f2',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                👍 123K
              </button>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '18px',
                backgroundColor: '#f2f2f2',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                👎
              </button>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '18px',
                backgroundColor: '#f2f2f2',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                ↗ Share
              </button>
            </div>
          </div>

          {/* Channel Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 0',
            borderTop: '1px solid #e0e0e0',
            borderBottom: '1px solid #e0e0e0',
            marginBottom: '24px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#ff0000',
              borderRadius: '50%',
              marginRight: '12px'
            }}></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>Rick Astley</div>
              <div style={{ fontSize: '12px', color: '#606060' }}>12.3M subscribers</div>
            </div>
            <button style={{
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '18px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}>
              Subscribe
            </button>
          </div>

          {/* Description */}
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '20px' }}>
              &ldquo;Never Gonna Give You Up&rdquo; is a song by English singer Rick Astley, released as a single in 1987.
              It was written and produced by Stock Aitken Waterman. The song was released as the first single from his debut album,
              Whenever You Need Somebody (1987). The song peaked at number one on the Billboard Hot 100.
            </p>
          </div>

          {/* Comments */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 400 }}>
              1,234 Comments
            </h3>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#ccc',
                borderRadius: '50%',
                flexShrink: 0
              }}></div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  style={{
                    width: '100%',
                    border: 'none',
                    borderBottom: '1px solid #e0e0e0',
                    padding: '8px 0',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            {/* Sample Comments */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#ccc',
                borderRadius: '50%',
                flexShrink: 0
              }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  User123 <span style={{ color: '#606060', fontWeight: 400 }}>2 days ago</span>
                </div>
                <div style={{ fontSize: '14px', lineHeight: '20px' }}>
                  This song never gets old! Rick rolled again 😂
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <button style={{ border: 'none', background: 'none', color: '#606060', fontSize: '12px', cursor: 'pointer' }}>👍 123</button>
                  <button style={{ border: 'none', background: 'none', color: '#606060', fontSize: '12px', cursor: 'pointer' }}>👎</button>
                  <button style={{ border: 'none', background: 'none', color: '#606060', fontSize: '12px', cursor: 'pointer' }}>Reply</button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#ccc',
                borderRadius: '50%',
                flexShrink: 0
              }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>
                  MusicFan <span style={{ color: '#606060', fontWeight: 400 }}>1 week ago</span>
                </div>
                <div style={{ fontSize: '14px', lineHeight: '20px' }}>
                  Classic 80s hit! Never gonna give you up, never gonna let you down 🎶
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <button style={{ border: 'none', background: 'none', color: '#606060', fontSize: '12px', cursor: 'pointer' }}>👍 89</button>
                  <button style={{ border: 'none', background: 'none', color: '#606060', fontSize: '12px', cursor: 'pointer' }}>👎</button>
                  <button style={{ border: 'none', background: 'none', color: '#606060', fontSize: '12px', cursor: 'pointer' }}>Reply</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 400 }}>
            Up next
          </h3>
          {/* Related Videos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{
                width: '120px',
                height: '68px',
                backgroundColor: '#ccc',
                borderRadius: '4px',
                flexShrink: 0
              }}></div>
              <div style={{ flex: 1, fontSize: '14px' }}>
                <div style={{ fontWeight: 500, lineHeight: '18px', marginBottom: '4px' }}>
                  Rick Astley - Together Forever
                </div>
                <div style={{ color: '#606060', fontSize: '12px' }}>
                  Rick Astley<br/>1.2M views
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              <div style={{
                width: '120px',
                height: '68px',
                backgroundColor: '#ccc',
                borderRadius: '4px',
                flexShrink: 0
              }}></div>
              <div style={{ flex: 1, fontSize: '14px' }}>
                <div style={{ fontWeight: 500, lineHeight: '18px', marginBottom: '4px' }}>
                  80s Hits Compilation
                </div>
                <div style={{ color: '#606060', fontSize: '12px' }}>
                  Retro Music<br/>500K views
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              <div style={{
                width: '120px',
                height: '68px',
                backgroundColor: '#ccc',
                borderRadius: '4px',
                flexShrink: 0
              }}></div>
              <div style={{ flex: 1, fontSize: '14px' }}>
                <div style={{ fontWeight: 500, lineHeight: '18px', marginBottom: '4px' }}>
                  Best Rick Rolls of All Time
                </div>
                <div style={{ color: '#606060', fontSize: '12px' }}>
                  Funny Videos<br/>2.3M views
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}