del "*.suo" /Q 2> nul
del "MsSqlServerDatabaseTablesGraph.WebApp\bin\*.pdb" /Q
del "MsSqlServerDatabaseTablesGraph.WebApp\*.csproj.user" /Q
rd "MsSqlServerDatabaseTablesGraph.WebApp\obj" /S/Q
rd "TestApp\bin" /S/Q
rd "TestApp\obj" /S/Q
