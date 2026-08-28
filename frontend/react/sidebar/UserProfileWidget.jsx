// Leaf component: renders the logged-in user's avatar/name/role from props only.
// Mirrors the avatar-initial fallback that the old AppSidebar custom element used
// when no image URL is available.
RX.UserProfileWidget = function UserProfileWidget({ name, role, initial, imgUrl }) {
    return (
        <div className="user-profile-widget">
            <div className="user-avatar" style={{ overflow: 'hidden' }}>
                {imgUrl ? (
                    <img src={imgUrl} alt={name} />
                ) : (
                    <div
                        style={{
                            background: '#1e293b',
                            color: 'white',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                        }}
                    >
                        {initial}
                    </div>
                )}
            </div>
            <div className="user-info">
                <span className="user-name">{name}</span>
                <span className="user-role">{role}</span>
            </div>
        </div>
    );
};
