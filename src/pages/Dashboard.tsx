import React, { useEffect, useState, useMemo } from 'react';
import { useAuthContext } from '../components/AuthProvider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { subscribeToTasks, Task } from '../services/db';
import { format, subDays, startOfWeek, endOfWeek, subWeeks, subMonths, startOfMonth, endOfMonth, isSameDay, getHours, getDay } from 'date-fns';
import clsx from 'clsx';

export default function Dashboard() {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'30Days'|'Quarter'|'Year'>('30Days');
  const [aiInsights, setAiInsights] = useState<{type: string; title: string; description: string}[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTasks(user.uid, (fetchedTasks) => {
      setTasks(fetchedTasks);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const fetchInsights = async () => {
    if (tasks.length === 0) return;
    setLoadingInsights(true);
    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, timeRange })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiInsights(data.insights || []);
      }
    } catch (err) {
      console.error("Failed to fetch insights", err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (tasks.length > 0 && aiInsights.length === 0 && !loadingInsights) {
        fetchInsights();
    }
  }, [tasks.length]);


  const completedTasks = tasks.filter(t => t.completed).length;
  const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < Date.now()).length;
  const totalTasks = tasks.length || 1; 
  const completionRate = Math.round((completedTasks / totalTasks) * 100);
  const overdueRate = Math.round((overdueTasks / totalTasks) * 100);
  
  // Weekly aggregation
  const thisWeekTasks = tasks.filter(t => t.createdAt >= Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekCompleted = thisWeekTasks.filter(t => t.completed).length;

  const lineData = useMemo(() => {
    const data = [];
    const weeksToIterate = timeRange === '30Days' ? 4 : timeRange === 'Quarter' ? 12 : 52;
    for(let i = weeksToIterate - 1; i >= 0; i--) {
      const d = subWeeks(new Date(), i);
      const start = startOfWeek(d, { weekStartsOn: 1 });
      const end = endOfWeek(d, { weekStartsOn: 1 });
      const name = timeRange === 'Year' ? format(start, 'MMM') : format(start, 'MMM d');
      const count = tasks.filter(t => {
        const date = new Date(t.completedAt || t.createdAt);
        return t.completed && date >= start && date <= end;
      }).length;
      data.push({ name, count });
    }
    return data;
  }, [tasks, timeRange]);

  const barData = useMemo(() => {
    const data = [];
    const months = timeRange === '30Days' ? 1 : timeRange === 'Quarter' ? 3 : 12;
    for(let i = months - 1; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const name = format(d, 'MMM');
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const count = tasks.filter(t => {
        const date = new Date(t.completedAt || t.createdAt);
        return t.completed && date >= start && date <= end;
      }).length;
      data.push({ name, tasks: count });
    }
    return data;
  }, [tasks, timeRange]);

  const activeMonthIndex = barData.length - 1;

  const peakPerformance = useMemo(() => {
    const grid = [
      [0, 0, 0, 0], // Morning
      [0, 0, 0, 0], // Afternoon
      [0, 0, 0, 0]  // Evening
    ];
    tasks.forEach(t => {
      if(!t.completed || !t.completedAt) return;
      const d = new Date(t.completedAt);
      const hour = getHours(d);
      const day = getDay(d);
      
      let row = 0;
      if (hour >= 12 && hour < 17) row = 1;
      else if (hour >= 17) row = 2;
      
      let col = 0;
      if (day === 1 || day === 2) col = 0;
      else if (day === 3 || day === 4) col = 1;
      else if (day === 5) col = 2;
      else if (day === 0 || day === 6) col = 3;
      
      grid[row][col]++;
    });
    
    let max = 0;
    let maxCoords = {r: -1, c: -1};
    for(let r=0; r<3; r++) {
      for(let c=0; c<4; c++) {
         if(grid[r][c] > max) { max = grid[r][c]; maxCoords = {r, c}; }
      }
    }
    return { grid, maxCoords, max };
  }, [tasks]);

  // Heatmap generation
  const colors = ['bg-surface-container-high', 'bg-chart-teal-muted', 'bg-primary-container', 'bg-primary'];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[24px] md:text-[32px] font-semibold text-primary mb-2 tracking-tight">Deep Productivity Insights</h2>
          <p className="text-[16px] text-on-surface-variant">Analyze your flow state patterns and optimize your output velocity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-surface-container/50 border border-border-glass rounded-lg p-1 backdrop-blur-sm">
          {(['30Days', 'Quarter', 'Year'] as const).map(range => (
            <button 
              key={range}
              onClick={() => setTimeRange(range)}
              className={clsx(
                "px-4 py-1.5 rounded-md text-[12px] font-semibold transition-colors",
                timeRange === range ? "bg-surface-variant text-on-surface shadow-sm border border-border-glass" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {range === '30Days' ? '30 Days' : range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Velocity Metric */}
        <div className="col-span-1 md:col-span-4 bg-surface-container/40 border border-border-glass rounded-xl p-lg backdrop-blur-xl relative overflow-hidden group hover:bg-surface-container/60 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
              <span className="material-symbols-outlined">speed</span>
            </div>
            <span className="flex items-center gap-1 text-success font-semibold text-[12px] bg-success/10 px-2 py-1 rounded-md border border-success/20">
              <span className="material-symbols-outlined text-[16px]">trending_up</span> +{thisWeekCompleted}
            </span>
          </div>
          <h3 className="font-medium text-[14px] text-on-surface-variant mb-1 relative z-10">Tasks Completed</h3>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-[36px] font-bold text-on-surface leading-[40px]">{completedTasks}</span>
            <span className="text-[14px] text-on-surface-variant">total</span>
          </div>
        </div>

        {/* Focus Score */}
        <div className="col-span-1 md:col-span-4 bg-surface-container/40 border border-border-glass rounded-xl p-lg backdrop-blur-xl relative overflow-hidden group hover:bg-surface-container/60 transition-all duration-300">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary-container/10 rounded-full blur-2xl group-hover:bg-secondary-container/20 transition-all"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-secondary-container/10 flex items-center justify-center border border-secondary-container/20 text-secondary-container">
              <span className="material-symbols-outlined">center_focus_strong</span>
            </div>
            <span className="flex items-center gap-1 text-on-surface-variant font-semibold text-[12px] bg-surface-variant px-2 py-1 rounded-md border border-border-glass">
              Tasks: {totalTasks === 1 && tasks.length === 0 ? 0 : totalTasks}
            </span>
          </div>
          <h3 className="font-medium text-[14px] text-on-surface-variant mb-1 relative z-10">Completion Rate</h3>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-[36px] font-bold text-on-surface leading-[40px]">{tasks.length === 0 ? 0 : completionRate}</span>
            <span className="text-[14px] text-on-surface-variant">%</span>
          </div>
        </div>

        {/* Overdue Pattern */}
        <div className="col-span-1 md:col-span-4 bg-surface-container/40 border border-border-glass border-l-4 border-l-warning rounded-xl p-lg backdrop-blur-xl relative overflow-hidden group hover:bg-surface-container/60 transition-all duration-300">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center border border-warning/20 text-warning">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <span className="flex items-center gap-1 text-warning font-semibold text-[12px] bg-warning/10 px-2 py-1 rounded-md border border-warning/20">
              <span className="material-symbols-outlined text-[16px]">trending_down</span> {overdueTasks} tasks
            </span>
          </div>
          <h3 className="font-medium text-[14px] text-on-surface-variant mb-1 relative z-10">Overdue Task Rate</h3>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-[36px] font-bold text-on-surface leading-[40px]">{tasks.length === 0 ? 0 : overdueRate}%</span>
            <span className="text-[14px] text-on-surface-variant">of total</span>
          </div>
        </div>

        {/* Line Chart Area */}
        <div className="col-span-1 md:col-span-8 bg-surface-container/30 border border-border-glass rounded-xl p-lg backdrop-blur-md flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[24px] font-medium text-on-surface">Flow State Intensity</h3>
              <p className="text-[12px] font-semibold text-on-surface-variant">Weekly task completion volume</p>
            </div>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          <div className="flex-1 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6bd8cb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6bd8cb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#bcc9c6', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#bcc9c6', fontSize: 10}} tickFormatter={(val) => `${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#23293c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                  itemStyle={{ color: '#6bd8cb', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6bd8cb" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart Area */}
        <div className="col-span-1 md:col-span-4 bg-surface-container/30 border border-border-glass rounded-xl p-lg backdrop-blur-md flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[24px] font-medium text-on-surface">Completion History</h3>
              <p className="text-[12px] font-semibold text-on-surface-variant">Tasks closed per month</p>
            </div>
          </div>
          <div className="flex-1 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#bcc9c6', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#bcc9c6', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#23293c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                  itemStyle={{ color: '#ddb8ff', fontWeight: 'bold' }}
                />
                <Bar dataKey="tasks" radius={[2, 2, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === activeMonthIndex ? '#7c03d3' : '#581C87'} className="transition-all duration-300 hover:fill-secondary-container" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap Area */}
        <div className="col-span-1 md:col-span-12 bg-surface-container/20 border border-border-glass rounded-xl p-lg backdrop-blur-sm overflow-x-auto">
          <div className="flex justify-between items-center mb-4 min-w-[600px]">
            <h3 className="text-[24px] font-medium text-on-surface">Consistency Map</h3>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-on-surface-variant">
              <span>Less</span>
              <div className="w-3 h-3 bg-surface-container-high rounded-sm"></div>
              <div className="w-3 h-3 bg-chart-teal-muted rounded-sm"></div>
              <div className="w-3 h-3 bg-primary-container rounded-sm"></div>
              <div className="w-3 h-3 bg-primary rounded-sm shadow-[0_0_8px_rgba(107,216,203,0.5)]"></div>
              <span>More</span>
            </div>
          </div>
          <div className="flex gap-1 min-w-[800px]">
            <div className="flex flex-col gap-1 pr-2 text-[10px] text-on-surface-variant justify-around py-1">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>
            {Array.from({ length: 45 }).map((_, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-1">
                {Array.from({ length: 7 }).map((_, rowIndex) => {
                  const d = subDays(new Date(), (44 - colIndex) * 7 + (6 - rowIndex));
                  const count = tasks.filter(t => t.completed && t.completedAt && isSameDay(new Date(t.completedAt), d)).length;
                  const c = count === 0 ? 'bg-surface-container-high' : count < 3 ? 'bg-chart-teal-muted' : count < 5 ? 'bg-primary-container' : 'bg-primary';
                  const isPrimary = c === 'bg-primary';
                  const hasDot = count >= 5;
                  const shadow = isPrimary ? 'shadow-[0_0_5px_rgba(107,216,203,0.5)]' : '';
                  return (
                    <div key={rowIndex} className={`w-[12px] h-[12px] ${c} rounded-sm ${shadow} relative transition-transform hover:scale-125 cursor-pointer`} title={`${format(d, 'MMM d, yyyy')}: ${count} tasks`}>
                      {hasDot && <div className="absolute inset-[3px] bg-secondary-container rounded-full"></div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Matrix */}
        <div className="col-span-1 md:col-span-6 bg-surface-container/30 border border-border-glass rounded-xl p-lg backdrop-blur-md overflow-x-auto">
          <h3 className="text-[24px] font-medium text-on-surface mb-6">Peak Performance Windows</h3>
          <div className="grid grid-cols-6 gap-2 min-w-[500px]">
            <div className="col-span-1 text-[10px] text-on-surface-variant flex items-end pb-2">Time</div>
            <div className="col-span-1 text-[10px] text-center text-on-surface-variant pb-2">Mon-Tue</div>
            <div className="col-span-1 text-[10px] text-center text-on-surface-variant pb-2">Wed-Thu</div>
            <div className="col-span-1 text-[10px] text-center text-on-surface-variant pb-2">Fri</div>
            <div className="col-span-2 text-[10px] text-center text-on-surface-variant pb-2">Weekend</div>
            
            <div className="col-span-1 text-xs text-on-surface-variant flex items-center">Morning</div>
            {[0, 1, 2, 3].map(col => {
              const val = peakPerformance.grid[0][col];
              const isMax = peakPerformance.max > 0 && peakPerformance.maxCoords.r === 0 && peakPerformance.maxCoords.c === col;
              return (
                <div key={`m-${col}`} className={clsx(`col-span-${col === 3 ? '2' : '1'} h-8 rounded-md border flex items-center justify-center relative`, 
                  val === 0 ? "bg-surface-container-high border-border-glass" :
                  val < 3 ? "bg-chart-teal-muted border-border-glass" :
                  isMax ? "bg-primary shadow-[0_0_10px_rgba(107,216,203,0.3)] border-primary/30" : "bg-primary-container border-border-glass"
                )}>
                  {isMax && <span className="material-symbols-outlined text-[14px] text-on-primary">local_fire_department</span>}
                </div>
              );
            })}
            
            <div className="col-span-1 text-xs text-on-surface-variant flex items-center">Afternoon</div>
            {[0, 1, 2, 3].map(col => {
              const val = peakPerformance.grid[1][col];
              const isMax = peakPerformance.max > 0 && peakPerformance.maxCoords.r === 1 && peakPerformance.maxCoords.c === col;
              return (
                <div key={`a-${col}`} className={clsx(`col-span-${col === 3 ? '2' : '1'} h-8 rounded-md border flex items-center justify-center relative`, 
                  val === 0 ? "bg-surface-container-high border-border-glass" :
                  val < 3 ? "bg-chart-teal-muted border-border-glass" :
                  isMax ? "bg-primary shadow-[0_0_10px_rgba(107,216,203,0.3)] border-primary/30" : "bg-primary-container border-border-glass"
                )}>
                  {isMax && <span className="material-symbols-outlined text-[14px] text-on-primary">local_fire_department</span>}
                </div>
              );
            })}
            
            <div className="col-span-1 text-xs text-on-surface-variant flex items-center">Evening</div>
            {[0, 1, 2, 3].map(col => {
              const val = peakPerformance.grid[2][col];
              const isMax = peakPerformance.max > 0 && peakPerformance.maxCoords.r === 2 && peakPerformance.maxCoords.c === col;
              return (
                <div key={`e-${col}`} className={clsx(`col-span-${col === 3 ? '2' : '1'} h-8 rounded-md border flex items-center justify-center relative`, 
                  val === 0 ? "bg-surface-container-high border-border-glass" :
                  val < 3 ? "bg-chart-teal-muted border-border-glass" :
                  isMax ? "bg-primary shadow-[0_0_10px_rgba(107,216,203,0.3)] border-primary/30" : "bg-primary-container border-border-glass"
                )}>
                  {isMax && <span className="material-symbols-outlined text-[14px] text-on-primary">local_fire_department</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="col-span-1 md:col-span-6 relative rounded-xl p-[1px] overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary-container via-surface-bg to-tertiary-container opacity-50"></div>
          <div className="relative bg-surface-container/80 h-full rounded-xl p-lg backdrop-blur-2xl flex flex-col z-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-container/20 rounded-full blur-[60px] pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary icon-fill">auto_awesome</span>
                <h3 className="text-[24px] font-medium text-secondary">Velora AI Insights</h3>
              </div>
              <button 
                onClick={fetchInsights} 
                disabled={loadingInsights}
                className="text-on-surface-variant hover:text-secondary disabled:opacity-50 transition-colors"
                title="Refresh Insights"
              >
                <span className={clsx("material-symbols-outlined text-[20px]", loadingInsights && "animate-spin")}>refresh</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-4 relative z-10 flex-1">
              {loadingInsights ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50 py-8">
                  <span className="material-symbols-outlined text-[32px] text-secondary animate-pulse">auto_awesome</span>
                  <p className="text-[14px] text-on-surface-variant">Analyzing your flow data...</p>
                </div>
              ) : aiInsights.length > 0 ? (
                aiInsights.map((insight, idx) => {
                  const isWarning = insight.type === 'warning';
                  return (
                    <div key={idx} className="bg-black/20 border border-white/5 rounded-lg p-4 flex gap-4 items-start relative overflow-hidden">
                      <div className={clsx("absolute left-0 top-0 bottom-0 w-1", isWarning ? "bg-tertiary" : "bg-primary")}></div>
                      <div className={clsx("mt-1 w-6 h-6 rounded-full flex items-center justify-center shrink-0", 
                        isWarning ? "bg-tertiary/20 text-tertiary" : "bg-primary/20 text-primary"
                      )}>
                        <span className="material-symbols-outlined text-[14px]">
                          {isWarning ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-[14px] text-on-surface mb-1">{insight.title}</h4>
                        <p className="text-[14px] text-on-surface-variant">{insight.description}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50 py-8">
                   <p className="text-[14px] text-on-surface-variant text-center">Complete more tasks to unlock personalized AI insights.</p>
                </div>
              )}
            </div>
            
            <button className="mt-6 pt-2 text-secondary hover:text-secondary-fixed transition-colors font-medium text-[14px] flex items-center gap-2 relative z-10 w-fit">
              View Full Analysis
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
