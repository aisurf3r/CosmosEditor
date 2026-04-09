import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { exportAsSeparateFiles, exportAsHTML } from '../utils/exportCode';

interface ExportMenuProps {
  html: string;
  css: string;
  js: string;
}

export default function ExportMenu({ html, css, js }: ExportMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportSeparate = () => {
    exportAsSeparateFiles(html, css, js);
    handleClose();
  };

  const handleExportHTML = () => {
    exportAsHTML(html, css, js);
    handleClose();
  };

  return (
    <>
      <Tooltip title="Export code">
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{
            color: 'text.secondary',
            opacity: 0.6,
            '&:hover': { opacity: 1, color: 'primary.main' },
            transition: 'all 0.15s',
          }}
        >
          <FileDownloadIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleExportSeparate}>
          3 Separate Files (.html, .css, .js)
        </MenuItem>
        <MenuItem onClick={handleExportHTML}>
          Single HTML File
        </MenuItem>
      </Menu>
    </>
  );
}
