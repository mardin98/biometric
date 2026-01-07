import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WeeklyChart = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('http://127.0.0.1:8000/api/v1/dashboard/weekly-stats');
                // Traducir días si es necesario o formatear
                const formattedData = res.data.map(item => ({
                    name: item.name, // Ej: Mon, Tue
                    Asistencias: item.count
                }));
                setData(formattedData);
            } catch (error) {
                console.error("Error cargando gráfica", error);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Tendencia Semanal</h3>

            <div className="h-full w-full pb-8">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="Asistencias" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default WeeklyChart;