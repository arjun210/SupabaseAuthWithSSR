/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { type FC, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { deleteChatData } from '../actions';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  Tooltip,
  Divider,
  Link as MuiLink,
  Button,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Chip,
  SwipeableDrawer,
  Drawer
} from '@mui/material';
import { Delete as DeleteIcon, Menu as MenuIcon } from '@mui/icons-material';
import { format } from 'date-fns';

type ChatPreview = {
  id: string;
  firstMessage: string;
  created_at: string;
};

type CombinedDrawerProps = {
  chatPreviews: ChatPreview[];
  chatId?: string;
};

const CombinedDrawer: FC<CombinedDrawerProps> = ({ chatPreviews, chatId }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();

  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const truncateMessage = (message: string, length: number) => {
    return message.length > length
      ? `${message.substring(0, length)}...`
      : message;
  };

  const isSelected = (id: string) => id === chatId;

  const handleDeleteClick = (id: string) => {
    setChatToDelete(id);
    setDeleteConfirmationOpen(true);
  };

  const handleDeleteConfirmation = async () => {
    if (chatToDelete) {
      try {
        await deleteChatData(chatToDelete);
        if (chatToDelete === chatId) {
          const newHref = '/aichat';
          router.replace(newHref, { scroll: false });
        }
      } catch (error) {
        console.error('Failed to delete the chat:', error);
      }
    }
    setDeleteConfirmationOpen(false);
    setChatToDelete(null);
  };

  const drawerWidth = 350;
  const modelType = searchParams.get('modeltype') || 'standart';
  const selectedOption =
    searchParams.get('modelselected') || 'gpt-3.5-turbo-1106';

  const chatListItems = chatPreviews.map(({ id, firstMessage, created_at }) => {
    const tooltipTitle = firstMessage || 'No messages yet';
    const truncatedMessage = truncateMessage(
      firstMessage || `Chat ID: ${id}`,
      24
    );
    const formattedDate = format(new Date(created_at), 'yyyy-MM-dd');

    const selectedStyle = isSelected(id)
      ? {
          backgroundColor: theme.palette.action.selected,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          borderRadius: '0 4px 4px 0'
        }
      : {};

    return (
      <React.Fragment key={id}>
        <Tooltip title={tooltipTitle} placement="left" arrow>
          <ListItem disablePadding>
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <MuiLink
                underline="none"
                sx={{ flexGrow: 1 }}
                onClick={() => {
                  const newPathname = `/aichat/${id}`;
                  const newQueryParams = new URLSearchParams({
                    modeltype: modelType,
                    modelselected: selectedOption
                  });
                  router.replace(
                    `${newPathname}?${newQueryParams.toString()}`,
                    { scroll: false }
                  );
                }}
              >
                <ListItemButton
                  sx={{
                    fontSize: '0.9rem',
                    ...selectedStyle,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'relative'
                  }}
                  onMouseEnter={() => setHoveredChatId(id)}
                  onMouseLeave={() => setHoveredChatId(null)}
                >
                  {truncatedMessage}
                  <Chip
                    label={formattedDate}
                    size="small"
                    sx={{
                      fontSize: '0.7rem'
                    }}
                  />
                  {hoveredChatId === id && (
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(id);
                      }}
                      size="small"
                      sx={{
                        padding: '2px',
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  )}
                </ListItemButton>
              </MuiLink>
            </Box>
          </ListItem>
        </Tooltip>
        <Divider />
      </React.Fragment>
    );
  });

  return (
    <>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={() => setDrawerOpen(true)}
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: theme.zIndex.drawer + 2,
          display: {
            xs: 'block',
            sm: 'block',
            md: 'none',
            lg: 'none',
            xl: 'none'
          }
        }}
      >
        <MenuIcon />
      </IconButton>
      <Box
        sx={{
          display: {
            xs: 'none',
            sm: 'none',
            md: 'block',
            lg: 'block',
            xl: 'block'
          }
        }}
      >
        <Drawer
          variant="permanent"
          anchor="right"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box'
            }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
              <ListItem
                key="newChat"
                disablePadding
                sx={{ width: '100%', padding: '8px 16px' }}
              >
                <MuiLink
                  underline="none"
                  sx={{ width: '100%', display: 'block' }}
                  onClick={() => {
                    const newQueryParams = new URLSearchParams({
                      modeltype: searchParams.get('modeltype') ?? 'standart',
                      modelselected:
                        searchParams.get('modelselected') ??
                        'gpt-3.5-turbo-1106'
                    });
                    router.replace(`/aichat?${newQueryParams.toString()}`, {
                      scroll: false
                    });
                  }}
                >
                  <Button variant="outlined" fullWidth>
                    New Chat
                  </Button>
                </MuiLink>
              </ListItem>
              <Divider />
              <List>{chatListItems}</List>
            </Box>
            <Box>
              <Divider />
              <List>
                {[
                  { href: '/', label: 'Home' },
                  { href: '/protected', label: 'Account' }
                ].map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem disablePadding>
                      <MuiLink href={item.href}>
                        <ListItemButton>{item.label}</ListItemButton>
                      </MuiLink>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </Box>
        </Drawer>
      </Box>
      <Box
        sx={{
          display: {
            xs: 'block',
            sm: 'block',
            md: 'none',
            lg: 'none',
            xl: 'none'
          }
        }}
      >
        <SwipeableDrawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onOpen={() => setDrawerOpen(true)}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box'
            }
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
              <ListItem
                key="newChat"
                disablePadding
                sx={{ width: '100%', padding: '8px 16px' }}
              >
                <MuiLink
                  underline="none"
                  sx={{ width: '100%', display: 'block' }}
                  onClick={() => {
                    const newQueryParams = new URLSearchParams({
                      modeltype: searchParams.get('modeltype') ?? 'standart',
                      modelselected:
                        searchParams.get('modelselected') ??
                        'gpt-3.5-turbo-1106'
                    });
                    router.replace(`/aichat?${newQueryParams.toString()}`, {
                      scroll: false
                    });
                  }}
                >
                  <Button variant="outlined" fullWidth>
                    New Chat
                  </Button>
                </MuiLink>
              </ListItem>
              <Divider />
              <List>{chatListItems}</List>
            </Box>
            <Box>
              <Divider />
              <List>
                {[
                  { href: '/', label: 'Home' },
                  { href: '/protected', label: 'Account' }
                ].map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem disablePadding>
                      <MuiLink href={item.href}>
                        <ListItemButton>{item.label}</ListItemButton>
                      </MuiLink>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Box>
          </Box>
        </SwipeableDrawer>
      </Box>
      <Dialog
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this chat?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmationOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirmation} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CombinedDrawer;
