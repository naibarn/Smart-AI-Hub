import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Snackbar,
  Pagination,
  Tabs,
  Tab,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload,
  Search,
  Delete,
  Visibility,
  Edit,
  Add,
  Refresh,
  FileDownload,
  Settings,
} from '@mui/icons-material';
import { ragService, Document, RAGQueryRequest, RAGQueryResponse } from '@/services';
import { DocumentAccessLevel } from '@shared/types/rag';
import { useAuth } from '@/hooks/useAuth';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rag-tabpanel-${index}`}
      aria-labelledby={`rag-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const RAGSystem: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [accessFilter, setAccessFilter] = useState<DocumentAccessLevel | ''>('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentAccessLevel, setDocumentAccessLevel] = useState<DocumentAccessLevel>(
    DocumentAccessLevel.PRIVATE
  );
  const [queryText, setQueryText] = useState('');
  const [queryResults, setQueryResults] = useState<RAGQueryResponse | null>(null);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalChunks: 0,
    totalQueries: 0,
    averageQueryTime: 0,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, [page, searchQuery, accessFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (searchQuery) params.search = searchQuery;
      if (accessFilter) params.accessLevel = accessFilter;

      const response = await ragService.getDocuments(params);
      setDocuments(response.data);
      setTotalPages(Math.ceil(response.total / 10));
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch documents',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await ragService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !documentTitle) {
      setSnackbar({
        open: true,
        message: 'Please select a file and enter a title',
        severity: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      await ragService.uploadDocument({
        file: selectedFile,
        title: documentTitle,
        accessLevel: documentAccessLevel,
      });

      setSnackbar({
        open: true,
        message: 'Document uploaded successfully',
        severity: 'success',
      });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentTitle('');
      setDocumentAccessLevel(DocumentAccessLevel.PRIVATE);
      fetchDocuments();
      fetchStats();
    } catch (error) {
      console.error('Failed to upload document:', error);
      setSnackbar({
        open: true,
        message: 'Failed to upload document',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async () => {
    if (!queryText) {
      setSnackbar({
        open: true,
        message: 'Please enter a query',
        severity: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      const request: RAGQueryRequest = {
        query: queryText,
        topK: 5,
      };
      const response = await ragService.query(request);
      setQueryResults(response);
    } catch (error) {
      console.error('Failed to query:', error);
      setSnackbar({
        open: true,
        message: 'Failed to query',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await ragService.deleteDocument(id);
      setSnackbar({
        open: true,
        message: 'Document deleted successfully',
        severity: 'success',
      });
      fetchDocuments();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete document:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete document',
        severity: 'error',
      });
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getAccessLevelColor = (level: DocumentAccessLevel) => {
    switch (level) {
      case DocumentAccessLevel.PRIVATE:
        return 'default';
      case DocumentAccessLevel.AGENT:
        return 'primary';
      case DocumentAccessLevel.AGENCY:
        return 'secondary';
      case DocumentAccessLevel.ORGANIZATION:
        return 'info';
      case DocumentAccessLevel.PUBLIC:
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        RAG System
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Documents
              </Typography>
              <Typography variant="h5">{stats.totalDocuments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Chunks
              </Typography>
              <Typography variant="h5">{stats.totalChunks}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Queries
              </Typography>
              <Typography variant="h5">{stats.totalQueries}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Query Time
              </Typography>
              <Typography variant="h5">{stats.averageQueryTime.toFixed(2)}ms</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Documents" />
          <Tab label="Query" />
        </Tabs>
      </Box>

      {/* Documents Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search documents"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Access Level</InputLabel>
            <Select
              value={accessFilter}
              onChange={(e) => setAccessFilter(e.target.value as DocumentAccessLevel | '')}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value={DocumentAccessLevel.PRIVATE}>Private</MenuItem>
              <MenuItem value={DocumentAccessLevel.AGENT}>Agent</MenuItem>
              <MenuItem value={DocumentAccessLevel.AGENCY}>Agency</MenuItem>
              <MenuItem value={DocumentAccessLevel.ORGANIZATION}>Organization</MenuItem>
              <MenuItem value={DocumentAccessLevel.PUBLIC}>Public</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<Add />} onClick={() => setUploadDialogOpen(true)}>
            Upload Document
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchDocuments}>
            Refresh
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Access Level</TableCell>
                <TableCell>File Size</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={doc.accessLevel}
                      color={getAccessLevelColor(doc.accessLevel)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {doc.fileSize ? `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={doc.status}
                      color={doc.status === 'completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <IconButton size="small">
                      <Visibility />
                    </IconButton>
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteDocument(doc.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination count={totalPages} page={page} onChange={(e, value) => setPage(value)} />
          </Box>
        )}
      </TabPanel>

      {/* Query Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Query RAG System
            </Typography>
            <TextField
              label="Enter your query"
              multiline
              rows={4}
              fullWidth
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleQuery}
              disabled={loading}
            >
              {loading ? 'Querying...' : 'Query'}
            </Button>
          </CardContent>
        </Card>

        {queryResults && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Query Results
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Found {queryResults.totalResults} results in {queryResults.queryTime}ms
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {queryResults.results.map((result, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {result.documentTitle}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {result.chunkText}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Chip label={`Score: ${result.score.toFixed(3)}`} size="small" />
                      <Typography variant="caption" color="textSecondary">
                        {result.metadata.pageNumber && `Page ${result.metadata.pageNumber}`}
                        {result.metadata.sectionTitle && ` - ${result.metadata.sectionTitle}`}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}
      </TabPanel>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <input
              type="file"
              accept=".pdf,.docx,.xlsx,.txt,.md"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                sx={{ mb: 2 }}
              >
                Select File
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                Selected: {selectedFile.name}
              </Typography>
            )}
            <TextField
              label="Document Title"
              fullWidth
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Access Level</InputLabel>
              <Select
                value={documentAccessLevel}
                onChange={(e) => setDocumentAccessLevel(e.target.value as DocumentAccessLevel)}
              >
                <MenuItem value={DocumentAccessLevel.PRIVATE}>Private</MenuItem>
                <MenuItem value={DocumentAccessLevel.AGENT}>Agent</MenuItem>
                <MenuItem value={DocumentAccessLevel.AGENCY}>Agency</MenuItem>
                <MenuItem value={DocumentAccessLevel.ORGANIZATION}>Organization</MenuItem>
                <MenuItem value={DocumentAccessLevel.PUBLIC}>Public</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUploadDocument}
            variant="contained"
            disabled={loading || !selectedFile || !documentTitle}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RAGSystem;
