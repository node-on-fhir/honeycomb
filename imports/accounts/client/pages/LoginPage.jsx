// imports/accounts/client/pages/LoginPage.jsx

import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { LoginForm } from '../components/LoginForm';
import WorkflowNavigation from '/imports/lib/WorkflowNavigation.js';
const { sanitizeReturnPath, appendReturnTo } = WorkflowNavigation;

// Card placement as a 3×3 grid over the router area. ?align=left|center|right
// and ?valign=top|center|bottom drop the card into one of nine cells; because
// each cell is a 1fr third and the card is centered WITHIN its cell, placement
// is "center-of-the-third" oriented — never jammed against a viewport edge.
const ALIGN_COLUMN = { left: 1, center: 2, right: 3 };
const VALIGN_ROW = { top: 1, center: 2, bottom: 3 };

function resolveCell(value, map) {
  const key = String(value || '').toLowerCase();
  return map[key] || map.center;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Route preservation: AuthGuard/NoAuthorizationPage thread the blocked
  // route here as ?returnTo=<encoded internal path>. searchParams.get()
  // already decoded once — sanitize the decoded value (internal paths only;
  // invalid/absent falls back to the home route).
  const returnTo = sanitizeReturnPath(searchParams.get('returnTo'));

  // Placement (defaults to dead-center when absent/invalid).
  const gridColumn = resolveCell(searchParams.get('align'), ALIGN_COLUMN);
  const gridRow = resolveCell(searchParams.get('valign'), VALIGN_ROW);

  const handleSuccess = function() {
    // Redirect to the originally requested page after successful login,
    // or home when none was preserved
    navigate(returnTo || '/');
  };

  const handleSignupClick = function() {
    // Forward returnTo so the route survives a signin <-> signup bounce
    navigate(appendReturnTo('/register', returnTo));
  };

  const handleForgotPasswordClick = function() {
    // returnTo intentionally NOT forwarded: the reset flow round-trips
    // through email -> /reset-password/:token, so the param is lost anyway
    navigate('/forgot-password');
  };

  return (
    // No page-level bgcolor here: StyledMainRouter paints background.default and
    // (with the ambiance axis) any background image. height:100% claims the
    // router's bounded height (rules/ui/layout-patterns.md) so the 3×3 grid can
    // vertically place the card; the card is centered within its 1fr cell, so
    // e.g. align=left sits it in the middle of the left third, not at the edge.
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        overflow: 'auto',
        p: 2
      }}
    >
      {/* Fixed card width (not 1fr of the cell) so justifySelf centers it on
          the third's center and lets it overflow into neighbors on narrow
          screens — center-oriented, never shrunk-to-third or edge-anchored. */}
      <Box sx={{ gridColumn: gridColumn, gridRow: gridRow, justifySelf: 'center', alignSelf: 'center', width: 'min(440px, calc(100vw - 32px))' }}>
        <LoginForm
          onSuccess={handleSuccess}
          onSignupClick={handleSignupClick}
          onForgotPasswordClick={handleForgotPasswordClick}
        />
      </Box>
    </Box>
  );
}
