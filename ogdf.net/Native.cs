using System;
using System.Runtime.InteropServices;

using CC = System.Runtime.InteropServices.CallingConvention;

namespace ogdf
{
    /// <summary>
    /// 
    /// </summary>
    internal static class Native
    {
        static Native() => load_native_ogdf();

        private static bool IsLinux()
        {
            var p = (int)Environment.OSVersion.Platform;
            return (p == 4) || (p == 6) || (p == 128);
        }
        private static bool Isx64() => (IntPtr.Size == 8);

        private const string DLL_NAME_WIN_x64 = "ogdf_x64.dll";
        private const string DLL_NAME_WIN_x86 = "ogdf_x86.dll";
        private const string DLL_NAME_LIN_x64 = "libogdf.so";
        private const string DLL_NAME_LIN_x86 = DLL_NAME_LIN_x64;
		
        private const string OGDFCore_AllocMapNodes_name    = "OGDFCore_AllocMapNodes";
        private const string OGDFCore_FreeMapNodes_name     = "OGDFCore_FreeMapNodes";
        private const string OGDFCore_AddNodesPair_name     = "OGDFCore_AddNodesPair";
        private const string OGDFCore_ProcessingCoords_name = "OGDFCore_ProcessingCoords";
        private const string OGDFCore_GetNodeCoords_name    = "OGDFCore_GetNodeCoords";
        private const string OGDFCore_SetNodeSize_name      = "OGDFCore_SetNodeSize";

        public delegate IntPtr OGDFCore_AllocMapNodes_Delegate   ( int count );
        public delegate void   OGDFCore_FreeMapNodes_Delegate    ( IntPtr data );
        public delegate void   OGDFCore_AddNodesPair_Delegate    ( IntPtr data, int nodeIndex1, int nodeIndex2 );
        public delegate void   OGDFCore_ProcessingCoords_Delegate( IntPtr data, [MarshalAs(UnmanagedType.I4)] ProcessingCoordsMode mode );
        public delegate bool   OGDFCore_GetNodeCoords_Delegate   ( IntPtr data, int nodeIndex, out double x, out double y );
        public delegate bool   OGDFCore_SetNodeSize_Delegate     ( IntPtr data, int nodeIndex, double width, double height );

        #region [.win.]
        #region [.x64.]
        [DllImport(DLL_NAME_WIN_x64, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_AllocMapNodes_name)]
        private extern static IntPtr OGDFCore_AllocMapNodes_win_x64( int count );

        [DllImport(DLL_NAME_WIN_x64, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_FreeMapNodes_name)]
        private extern static void OGDFCore_FreeMapNodes_win_x64( IntPtr data );

        [DllImport(DLL_NAME_WIN_x64, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_AddNodesPair_name)]
        private extern static void OGDFCore_AddNodesPair_win_x64( IntPtr data, int nodeIndex1, int nodeIndex2 );

        [DllImport(DLL_NAME_WIN_x64, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_ProcessingCoords_name)]
        private extern static void OGDFCore_ProcessingCoords_win_x64( IntPtr data, [MarshalAs( UnmanagedType.I4 )] ProcessingCoordsMode eMode );

        [DllImport( DLL_NAME_WIN_x64, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_GetNodeCoords_name )]
        private extern static bool OGDFCore_GetNodeCoords_win_x64( IntPtr data, int nodeIndex, out double x, out double y );

        [DllImport(DLL_NAME_WIN_x64, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_SetNodeSize_name)]
        private extern static bool OGDFCore_SetNodeSize_win_x64( IntPtr data, int nodeIndex, double width, double height );
        #endregion

        #region [.x86.]
        [DllImport(DLL_NAME_WIN_x86, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_AllocMapNodes_name)]
        private extern static IntPtr OGDFCore_AllocMapNodes_win_x86( int count );

        [DllImport(DLL_NAME_WIN_x86, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_FreeMapNodes_name)]
        private extern static void OGDFCore_FreeMapNodes_win_x86( IntPtr data );

        [DllImport(DLL_NAME_WIN_x86, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_AddNodesPair_name)]
        private extern static void OGDFCore_AddNodesPair_win_x86( IntPtr data, int nodeIndex1, int nodeIndex2 );

        [DllImport(DLL_NAME_WIN_x86, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_ProcessingCoords_name)]
        private extern static void OGDFCore_ProcessingCoords_win_x86( IntPtr data, [MarshalAs( UnmanagedType.I4 )] ProcessingCoordsMode eMode );

        [DllImport( DLL_NAME_WIN_x86, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_GetNodeCoords_name )]
        private extern static bool OGDFCore_GetNodeCoords_win_x86( IntPtr data, int nodeIndex, out double x, out double y );

        [DllImport(DLL_NAME_WIN_x86, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_SetNodeSize_name)]
        private extern static bool OGDFCore_SetNodeSize_win_x86( IntPtr data, int nodeIndex, double width, double height );
        #endregion
        #endregion

        #region [.linux.]
        #region [.x64.]
        [DllImport(DLL_NAME_LIN_x64, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_AllocMapNodes_name)]
        private extern static IntPtr OGDFCore_AllocMapNodes_lin_x64( int count );

        [DllImport(DLL_NAME_LIN_x64, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_FreeMapNodes_name)]
        private extern static void OGDFCore_FreeMapNodes_lin_x64( IntPtr data );

        [DllImport(DLL_NAME_LIN_x64, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_AddNodesPair_name)]
        private extern static void OGDFCore_AddNodesPair_lin_x64( IntPtr data, int nodeIndex1, int nodeIndex2 );

        [DllImport(DLL_NAME_LIN_x64, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_ProcessingCoords_name)]
        private extern static void OGDFCore_ProcessingCoords_lin_x64( IntPtr data, [MarshalAs( UnmanagedType.I4 )] ProcessingCoordsMode eMode );

        [DllImport( DLL_NAME_LIN_x64, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_GetNodeCoords_name )]
        private extern static bool OGDFCore_GetNodeCoords_lin_x64( IntPtr data, int nodeIndex, out double x, out double y );

        [DllImport(DLL_NAME_LIN_x64, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_SetNodeSize_name)]
        private extern static bool OGDFCore_SetNodeSize_lin_x64( IntPtr data, int nodeIndex, double width, double height );
        #endregion

        #region [.x86.]
        [DllImport( DLL_NAME_LIN_x86, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_AllocMapNodes_name )]
        private extern static IntPtr OGDFCore_AllocMapNodes_lin_x86( int count );

        [DllImport( DLL_NAME_LIN_x86, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_FreeMapNodes_name )]
        private extern static void OGDFCore_FreeMapNodes_lin_x86( IntPtr data );

        [DllImport( DLL_NAME_LIN_x86, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_AddNodesPair_name )]
        private extern static void OGDFCore_AddNodesPair_lin_x86( IntPtr data, int nodeIndex1, int nodeIndex2 );

        [DllImport( DLL_NAME_LIN_x86, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_ProcessingCoords_name )]
        private extern static void OGDFCore_ProcessingCoords_lin_x86( IntPtr data, [MarshalAs( UnmanagedType.I4 )] ProcessingCoordsMode eMode );

        [DllImport( DLL_NAME_LIN_x86, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_GetNodeCoords_name )]
        private extern static bool OGDFCore_GetNodeCoords_lin_x86( IntPtr data, int nodeIndex, out double x, out double y );

        [DllImport( DLL_NAME_LIN_x86, CallingConvention=CC.Cdecl, EntryPoint=OGDFCore_SetNodeSize_name )]
        private extern static bool OGDFCore_SetNodeSize_lin_x86( IntPtr data, int nodeIndex, double width, double height );
        #endregion
        #endregion

        public static OGDFCore_AllocMapNodes_Delegate    OGDFCore_AllocMapNodes    { get; private set; }
        public static OGDFCore_FreeMapNodes_Delegate     OGDFCore_FreeMapNodes     { get; private set; }
        public static OGDFCore_AddNodesPair_Delegate     OGDFCore_AddNodesPair     { get; private set; }
        public static OGDFCore_ProcessingCoords_Delegate OGDFCore_ProcessingCoords { get; private set; }
        public static OGDFCore_GetNodeCoords_Delegate    OGDFCore_GetNodeCoords    { get; private set; }
        public static OGDFCore_SetNodeSize_Delegate      OGDFCore_SetNodeSize      { get; private set; }

        private static void load_native_ogdf()
		{
            if ( IsLinux() )
            {
                if ( Isx64() )
                {
                    OGDFCore_AllocMapNodes    = OGDFCore_AllocMapNodes_lin_x64;
                    OGDFCore_FreeMapNodes     = OGDFCore_FreeMapNodes_lin_x64;
                    OGDFCore_AddNodesPair     = OGDFCore_AddNodesPair_lin_x64;
                    OGDFCore_ProcessingCoords = OGDFCore_ProcessingCoords_lin_x64;
                    OGDFCore_GetNodeCoords    = OGDFCore_GetNodeCoords_lin_x64;
                    OGDFCore_SetNodeSize      = OGDFCore_SetNodeSize_lin_x64;
                }
                else
                {
                    OGDFCore_AllocMapNodes    = OGDFCore_AllocMapNodes_lin_x86;
                    OGDFCore_FreeMapNodes     = OGDFCore_FreeMapNodes_lin_x86;
                    OGDFCore_AddNodesPair     = OGDFCore_AddNodesPair_lin_x86;
                    OGDFCore_ProcessingCoords = OGDFCore_ProcessingCoords_lin_x86;
                    OGDFCore_GetNodeCoords    = OGDFCore_GetNodeCoords_lin_x86;
                    OGDFCore_SetNodeSize      = OGDFCore_SetNodeSize_lin_x86;
                }
            } 
            else 
            {
                if ( Isx64() )
                {
                    OGDFCore_AllocMapNodes    = OGDFCore_AllocMapNodes_win_x64;
                    OGDFCore_FreeMapNodes     = OGDFCore_FreeMapNodes_win_x64;
                    OGDFCore_AddNodesPair     = OGDFCore_AddNodesPair_win_x64;
                    OGDFCore_ProcessingCoords = OGDFCore_ProcessingCoords_win_x64;
                    OGDFCore_GetNodeCoords    = OGDFCore_GetNodeCoords_win_x64;
                    OGDFCore_SetNodeSize      = OGDFCore_SetNodeSize_win_x64;
                }
                else
                {
                    OGDFCore_AllocMapNodes    = OGDFCore_AllocMapNodes_win_x86;
                    OGDFCore_FreeMapNodes     = OGDFCore_FreeMapNodes_win_x86;
                    OGDFCore_AddNodesPair     = OGDFCore_AddNodesPair_win_x86;
                    OGDFCore_ProcessingCoords = OGDFCore_ProcessingCoords_win_x86;
                    OGDFCore_GetNodeCoords    = OGDFCore_GetNodeCoords_win_x86;
                    OGDFCore_SetNodeSize      = OGDFCore_SetNodeSize_win_x86;
                }
            }
		}
    }
}
