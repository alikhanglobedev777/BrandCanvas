"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";

const drawerWidth = 248;

export interface DashboardNavigationItem {
  label: string;
  href: string;
  selected?: boolean;
}

export interface DashboardShellProps {
  navigation: DashboardNavigationItem[];
  children: ReactNode;
  accountLabel?: string;
  onSignOut?: () => void;
}

export function DashboardShell({ navigation, children, accountLabel = "Administrator", onSignOut }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar>
        <Box>
          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 850 }}>
            BrandCanvas
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Commerce administration
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ p: 1.5, flex: 1 }}>
        {navigation.map((item) => (
          <ListItemButton
            key={item.href}
            href={item.href}
            selected={item.selected}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{ ml: { lg: `${drawerWidth}px` }, width: { lg: `calc(100% - ${drawerWidth}px)` }, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Button sx={{ display: { lg: "none" } }} onClick={() => setMobileOpen(true)}>
            Menu
          </Button>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {accountLabel}
            </Typography>
            {onSignOut ? (
              <Button variant="outlined" onClick={onSignOut}>
                Sign out
              </Button>
            ) : null}
          </Stack>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", lg: "none" }, "& .MuiDrawer-paper": { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", lg: "block" },
            "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
        <Toolbar />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
