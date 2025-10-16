import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Eye,
  Settings,
} from 'lucide-react';

interface SecurityHeader {
  name: string;
  enabled: boolean;
  value?: string;
  description: string;
}

interface CspViolation {
  id: string;
  timestamp: string;
  userAgent: string;
  ip: string;
  report: {
    'document-uri'?: string;
    'violated-directive'?: string;
    'blocked-uri'?: string;
    'original-policy'?: string;
  };
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

interface CspStats {
  total: number;
  unresolved: number;
  byDirective: Record<string, number>;
  byBlockedUri: Record<string, number>;
  recent24h: number;
}

interface SecurityScore {
  grade: string;
  score: number;
  issues: string[];
  recommendations: string[];
}

const SecurityDashboard: React.FC = () => {
  const [securityHeaders, setSecurityHeaders] = useState<SecurityHeader[]>([]);
  const [cspViolations, setCspViolations] = useState<CspViolation[]>([]);
  const [cspStats, setCspStats] = useState<CspStats | null>(null);
  const [securityScore, setSecurityScore] = useState<SecurityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('headers');

  // Fetch security headers status
  const fetchSecurityHeaders = async () => {
    try {
      const response = await fetch('/api/v1/security/headers/status');
      if (response.ok) {
        const data = await response.json();
        setSecurityHeaders(data);
      }
    } catch (err) {
      console.error('Failed to fetch security headers:', err);
    }
  };

  // Fetch CSP violations
  const fetchCspViolations = async () => {
    try {
      const response = await fetch('/api/v1/security/csp-violations?limit=50');
      if (response.ok) {
        const data = await response.json();
        setCspViolations(data.violations);
        setCspStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch CSP violations:', err);
    }
  };

  // Calculate security score
  const calculateSecurityScore = () => {
    const enabledHeaders = securityHeaders.filter((h) => h.enabled).length;
    const totalHeaders = securityHeaders.length;
    const headerScore = (enabledHeaders / totalHeaders) * 50;

    const unresolvedIssues = cspStats?.unresolved || 0;
    const violationScore = Math.max(0, 30 - unresolvedIssues * 2);

    const hasHsts = securityHeaders.find((h) => h.name === 'Strict-Transport-Security')?.enabled;
    const hstsBonus = hasHsts ? 10 : 0;

    const hasCsp = securityHeaders.find((h) => h.name === 'Content-Security-Policy')?.enabled;
    const cspBonus = hasCsp ? 10 : 0;

    const totalScore = Math.round(headerScore + violationScore + hstsBonus + cspBonus);

    let grade = 'F';
    if (totalScore >= 90) grade = 'A+';
    else if (totalScore >= 85) grade = 'A';
    else if (totalScore >= 80) grade = 'B+';
    else if (totalScore >= 75) grade = 'B';
    else if (totalScore >= 70) grade = 'C+';
    else if (totalScore >= 65) grade = 'C';
    else if (totalScore >= 60) grade = 'D';
    else if (totalScore >= 50) grade = 'D-';

    const issues = [];
    const recommendations = [];

    if (!hasHsts) {
      issues.push('HSTS not enabled');
      recommendations.push('Enable HTTP Strict Transport Security');
    }

    if (!hasCsp) {
      issues.push('CSP not enabled');
      recommendations.push('Implement Content Security Policy');
    }

    if (unresolvedIssues > 10) {
      issues.push('High number of CSP violations');
      recommendations.push('Review and fix CSP violations');
    }

    setSecurityScore({
      grade,
      score: totalScore,
      issues,
      recommendations,
    });
  };

  // Resolve CSP violation
  const resolveViolation = async (violationId: string) => {
    try {
      const response = await fetch(`/api/v1/security/csp-violations/${violationId}/resolve`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchCspViolations();
      }
    } catch (err) {
      console.error('Failed to resolve violation:', err);
    }
  };

  // Clear resolved violations
  const clearResolvedViolations = async () => {
    try {
      const response = await fetch('/api/v1/security/csp-violations', {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchCspViolations();
      }
    } catch (err) {
      console.error('Failed to clear violations:', err);
    }
  };

  // Test security headers
  const testSecurityHeaders = async () => {
    try {
      const response = await fetch('/api/v1/security/test-headers', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        alert(`Security test completed. Score: ${data.score}/100`);
        fetchSecurityHeaders();
      }
    } catch (err) {
      console.error('Failed to test security headers:', err);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      await Promise.all([fetchSecurityHeaders(), fetchCspViolations()]);

      setLoading(false);
    };

    loadData();
  }, []);

  // Recalculate security score when data changes
  useEffect(() => {
    if (securityHeaders.length > 0 || cspStats) {
      calculateSecurityScore();
    }
  }, [securityHeaders, cspStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading security data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage security headers and CSP violations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={testSecurityHeaders} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Test Headers
          </Button>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Score Card */}
      {securityScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div
                className={`text-4xl font-bold ${
                  securityScore.grade === 'A+'
                    ? 'text-green-600'
                    : securityScore.grade.startsWith('A')
                      ? 'text-green-500'
                      : securityScore.grade.startsWith('B')
                        ? 'text-yellow-500'
                        : securityScore.grade.startsWith('C')
                          ? 'text-orange-500'
                          : 'text-red-500'
                }`}
              >
                {securityScore.grade}
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Overall Score</div>
                <div className="text-2xl font-semibold">{securityScore.score}/100</div>
              </div>
            </div>

            {securityScore.issues.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-red-600 mb-2">Issues:</h4>
                <ul className="text-sm space-y-1">
                  {securityScore.issues.map((issue, index) => (
                    <li key={index} className="flex items-center">
                      <XCircle className="h-3 w-3 mr-2 text-red-500" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {securityScore.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-blue-600 mb-2">Recommendations:</h4>
                <ul className="text-sm space-y-1">
                  {securityScore.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-2 text-blue-500" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="headers">Security Headers</TabsTrigger>
          <TabsTrigger value="violations">CSP Violations</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="headers">
          <Card>
            <CardHeader>
              <CardTitle>Security Headers Status</CardTitle>
              <CardDescription>
                Current status of security headers across all services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Header</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityHeaders.map((header) => (
                    <TableRow key={header.name}>
                      <TableCell className="font-medium">{header.name}</TableCell>
                      <TableCell>
                        <Badge variant={header.enabled ? 'default' : 'destructive'}>
                          {header.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{header.value || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {header.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>CSP Violations</CardTitle>
                  <CardDescription>Recent Content Security Policy violations</CardDescription>
                </div>
                <Button onClick={clearResolvedViolations} variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Resolved
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {cspViolations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No CSP violations</h3>
                  <p className="text-muted-foreground">
                    Great! Your Content Security Policy is working correctly.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Directive</TableHead>
                      <TableHead>Blocked URI</TableHead>
                      <TableHead>Document URI</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cspViolations.map((violation) => (
                      <TableRow key={violation.id}>
                        <TableCell className="text-sm">
                          {new Date(violation.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {violation.report['violated-directive'] || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {violation.report['blocked-uri'] || '-'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {violation.report['document-uri'] || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={violation.resolved ? 'default' : 'destructive'}>
                            {violation.resolved ? 'Resolved' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!violation.resolved && (
                            <Button
                              onClick={() => resolveViolation(violation.id)}
                              variant="outline"
                              size="sm"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cspStats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{cspStats?.unresolved || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cspStats?.recent24h || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Headers Enabled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {securityHeaders.filter((h) => h.enabled).length}/{securityHeaders.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {cspStats?.byDirective && Object.keys(cspStats.byDirective).length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Violations by Directive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(cspStats.byDirective).map(([directive, count]) => (
                    <div key={directive} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{directive}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;
