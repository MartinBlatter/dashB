export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
            }}
        >
            <span>© {year} DashB</span>
        </div>
    );
}
