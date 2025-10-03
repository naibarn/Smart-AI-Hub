import React from 'react';
import { Container, Typography, Button } from '@mui/material';

function App(): React.JSX.Element {
  return (
    <Container maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>
        Smart AI Hub Frontend
      </Typography>
      <Typography variant="body1" gutterBottom>
        Welcome to the Smart AI Hub!
      </Typography>
      <Button variant="contained" color="primary">
        Get Started
      </Button>
    </Container>
  );
}

export default App;