// Dashboard Dummy Data
export const dashboardData = {
    kpi: [
        { id: 1, label: "Today's Revenue", value: "$4,250", trend: "+12%", trendUp: true },
        { id: 2, label: "Today's Orders", value: "125", trend: "+5%", trendUp: true },
        { id: 3, label: "Pending Actions", value: "18", trend: "High Priority", trendUp: false, alert: true },
        { id: 4, label: "Low Stock Alerts", value: "7", trend: "Needs Attention", trendUp: false, alert: true },
    ],
    aiInsights: {
        summary: "Business is trending up 12% DoD. High conversion rate (4.2%) detected in Electronics category. Morning traffic spike observed between 9-11 AM.",
        alerts: [
            { id: 1, type: "critical", message: "Inventory critical for 'Wireless Headphones' (< 5 units)." },
            { id: 2, type: "warning", message: "Delayed shipments detected in 'North Region' (3 orders)." }
        ],
        recommendations: [
            { id: 1, message: "Restock 'Electronics' category to prevent stockout." },
            { id: 2, message: "Launch flash sale for 'Summer Collection' to clear slow inventory." }
        ]
    },
    charts: {
        revenue: [
            { time: '09:00', value: 1200 },
            { time: '12:00', value: 2100 },
            { time: '15:00', value: 1800 },
            { time: '18:00', value: 2400 },
            { time: '21:00', value: 3100 },
        ],
        orderStatus: [
            { name: 'Pending', value: 15 },
            { name: 'Processing', value: 45 },
            { name: 'Shipped', value: 30 },
            { name: 'Returned', value: 10 },
        ]
    },
    tables: {
        lowStock: [
            { id: 101, name: "Wireless Earbuds", stock: 3, status: "Critical" },
            { id: 102, name: "Smart Watch Gen 3", stock: 5, status: "Critical" },
            { id: 103, name: "USB-C Cable", stock: 12, status: "Low" },
            { id: 104, name: "Laptop Stand", stock: 8, status: "Low" },
            { id: 105, name: "Mechanical Keyboard", stock: 4, status: "Critical" },
        ],
        recentActivity: [
            { id: 1, action: "Order #4592 Refunded", user: "Admin", time: "10 mins ago" },
            { id: 2, action: "New Product Added", user: "Manager", time: "1 hour ago" },
            { id: 3, action: "Stock Updated (Batch #B12)", user: "System", time: "2 hours ago" },
            { id: 4, action: "Settings Changed", user: "Admin", time: "4 hours ago" },
        ]
    }
};
