import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
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
  Rating,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Star,
  Download,
  Visibility,
  ThumbUp,
  ThumbDown,
  Comment,
  Category,
  TrendingUp,
  NewReleases,
} from '@mui/icons-material';
import {
  agentSkillsService,
  AgentSkill,
  SkillCategory,
  SkillReview,
  CreateSkillInput,
  CreateReviewInput,
} from '@/services';
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
      id={`skills-tabpanel-${index}`}
      aria-labelledby={`skills-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AgentSkillsMarketplace: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [userSkills, setUserSkills] = useState<AgentSkill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<AgentSkill | null>(null);
  const [skillReviews, setSkillReviews] = useState<SkillReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [skillDetailDialogOpen, setSkillDetailDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Form states
  const [skillName, setSkillName] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [skillLongDescription, setSkillLongDescription] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  const [skillPlatform, setSkillPlatform] = useState('');
  const [skillTags, setSkillTags] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    fetchSkills();
    fetchCategories();
    if (user) {
      fetchUserSkills();
    }
  }, [page, searchQuery, selectedCategory, sortBy]);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 12, sortBy };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;

      const response = await agentSkillsService.getSkills(params);
      setSkills(response.data);
      setTotalPages(Math.ceil(response.total / 12));
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch skills',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await agentSkillsService.getSkillCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchUserSkills = async () => {
    try {
      const response = await agentSkillsService.getUserSkills();
      setUserSkills(response.data);
    } catch (error) {
      console.error('Failed to fetch user skills:', error);
    }
  };

  const fetchSkillReviews = async (skillId: string) => {
    try {
      const response = await agentSkillsService.getSkillReviews(skillId);
      setSkillReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch skill reviews:', error);
    }
  };

  const handleSubmitSkill = async () => {
    if (!skillName || !skillDescription || !skillCategory || !skillPlatform) {
      setSnackbar({
        open: true,
        message: 'Please fill all required fields',
        severity: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      const skillData: CreateSkillInput = {
        name: skillName,
        description: skillDescription,
        longDescription: skillLongDescription,
        categoryId: skillCategory,
        platformId: skillPlatform,
        visibility: 'PUBLIC' as any, // Simplified for demo
        tags: skillTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      await agentSkillsService.submitSkill(skillData);
      setSnackbar({
        open: true,
        message: 'Skill submitted successfully',
        severity: 'success',
      });
      setSubmitDialogOpen(false);
      resetSkillForm();
      fetchSkills();
      fetchUserSkills();
    } catch (error) {
      console.error('Failed to submit skill:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit skill',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInstallSkill = async (skillId: string) => {
    try {
      await agentSkillsService.installSkill(skillId);
      setSnackbar({
        open: true,
        message: 'Skill installed successfully',
        severity: 'success',
      });
      fetchSkills();
    } catch (error) {
      console.error('Failed to install skill:', error);
      setSnackbar({
        open: true,
        message: 'Failed to install skill',
        severity: 'error',
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedSkill || !reviewComment) {
      setSnackbar({
        open: true,
        message: 'Please provide a rating and comment',
        severity: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      const reviewData = {
        rating: reviewRating,
        comment: reviewComment,
      };

      await agentSkillsService.createSkillReview(selectedSkill.id, reviewData);
      setSnackbar({
        open: true,
        message: 'Review submitted successfully',
        severity: 'success',
      });
      setReviewDialogOpen(false);
      resetReviewForm();
      fetchSkillReviews(selectedSkill.id);
    } catch (error) {
      console.error('Failed to submit review:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit review',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewSkill = async (skill: AgentSkill) => {
    setSelectedSkill(skill);
    setSkillDetailDialogOpen(true);
    fetchSkillReviews(skill.id);
  };

  const resetSkillForm = () => {
    setSkillName('');
    setSkillDescription('');
    setSkillLongDescription('');
    setSkillCategory('');
    setSkillPlatform('');
    setSkillTags('');
  };

  const resetReviewForm = () => {
    setReviewRating(5);
    setReviewComment('');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getSortLabel = (value: string) => {
    switch (value) {
      case 'popular':
        return 'Most Popular';
      case 'newest':
        return 'Newest';
      case 'highest_rated':
        return 'Highest Rated';
      case 'name':
        return 'Name';
      default:
        return value;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Agent Skills Marketplace
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Browse Skills" />
          <Tab label="My Skills" />
        </Tabs>
      </Box>

      {/* Browse Skills Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search skills"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1 }} />,
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <MenuItem value="popular">Most Popular</MenuItem>
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="highest_rated">Highest Rated</MenuItem>
              <MenuItem value="name">Name</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<Add />} onClick={() => setSubmitDialogOpen(true)}>
            Submit Skill
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={3}>
          {skills.map((skill) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={skill.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {skill.iconUrl && (
                  <CardMedia component="img" height="140" image={skill.iconUrl} alt={skill.name} />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {skill.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {skill.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={skill.averageRating} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({skill.reviewCount})
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Download fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">{skill.installCount} installs</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {skill.tags.slice(0, 3).map((tag) => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handleViewSkill(skill)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Download />}
                      onClick={() => handleInstallSkill(skill.id)}
                    >
                      Install
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination count={totalPages} page={page} onChange={(e, value) => setPage(value)} />
          </Box>
        )}
      </TabPanel>

      {/* My Skills Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Your Submitted Skills</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setSubmitDialogOpen(true)}>
            Submit New Skill
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={3}>
          {userSkills.map((skill) => (
            <Grid item xs={12} sm={6} md={4} key={skill.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {skill.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {skill.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip
                      label={skill.status}
                      color={
                        skill.status === 'approved'
                          ? 'success'
                          : skill.status === 'pending'
                            ? 'warning'
                            : skill.status === 'rejected'
                              ? 'error'
                              : 'default'
                      }
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={skill.averageRating} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      ({skill.reviewCount} reviews)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handleViewSkill(skill)}
                    >
                      View
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<Edit />}>
                      Edit
                    </Button>
                    <Button size="small" variant="outlined" color="error" startIcon={<Delete />}>
                      Delete
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Submit Skill Dialog */}
      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Submit New Skill</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Skill Name"
              fullWidth
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={skillDescription}
              onChange={(e) => setSkillDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Long Description"
              fullWidth
              multiline
              rows={4}
              value={skillLongDescription}
              onChange={(e) => setSkillLongDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select value={skillCategory} onChange={(e) => setSkillCategory(e.target.value)}>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Platform</InputLabel>
              <Select value={skillPlatform} onChange={(e) => setSkillPlatform(e.target.value)}>
                <MenuItem value="openai">OpenAI</MenuItem>
                <MenuItem value="anthropic">Anthropic</MenuItem>
                <MenuItem value="google">Google</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Tags (comma separated)"
              fullWidth
              value={skillTags}
              onChange={(e) => setSkillTags(e.target.value)}
              helperText="e.g., automation, productivity, ai"
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitSkill} variant="contained" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Skill'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Skill Detail Dialog */}
      <Dialog
        open={skillDetailDialogOpen}
        onClose={() => setSkillDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedSkill?.name}</DialogTitle>
        <DialogContent>
          {selectedSkill && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body1" paragraph>
                {selectedSkill.description}
              </Typography>
              {selectedSkill.longDescription && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedSkill.longDescription}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Rating value={selectedSkill.averageRating} precision={0.1} readOnly />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  ({selectedSkill.reviewCount} reviews)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Download fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">{selectedSkill.installCount} installs</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {selectedSkill.tags.map((tag) => (
                  <Chip key={tag} label={tag} />
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Reviews
              </Typography>
              <List>
                {skillReviews.map((review) => (
                  <ListItem key={review.id} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar>{review.userId[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating value={review.rating} readOnly size="small" />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                      secondary={review.comment}
                    />
                  </ListItem>
                ))}
              </List>
              {skillReviews.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: 'center', py: 2 }}
                >
                  No reviews yet. Be the first to review this skill!
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillDetailDialogOpen(false)}>Close</Button>
          <Button
            variant="outlined"
            startIcon={<Comment />}
            onClick={() => {
              setSkillDetailDialogOpen(false);
              setReviewDialogOpen(true);
            }}
          >
            Write Review
          </Button>
          {selectedSkill && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => handleInstallSkill(selectedSkill.id)}
            >
              Install
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Write a Review</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography component="legend">Rating</Typography>
            <Rating
              value={reviewRating}
              onChange={(e, newValue) => setReviewRating(newValue || 5)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Your Review"
              fullWidth
              multiline
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitReview} variant="contained" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Review'}
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

export default AgentSkillsMarketplace;
